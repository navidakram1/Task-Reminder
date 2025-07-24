-- Multiple Households Support
-- Run this in your Supabase SQL Editor

-- Add active_household_id to profiles table to track current active household
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active_household_id UUID REFERENCES households(id) ON DELETE SET NULL;

-- Create household_activity table for activity feed across households
CREATE TABLE IF NOT EXISTS household_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('task_created', 'task_completed', 'task_approved', 'bill_added', 'member_joined', 'role_changed')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_household_activity_household_id ON household_activity(household_id);
CREATE INDEX IF NOT EXISTS idx_household_activity_created_at ON household_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_active_household ON profiles(active_household_id);

-- Enable RLS on household_activity
ALTER TABLE household_activity ENABLE ROW LEVEL SECURITY;

-- RLS policy for household_activity
CREATE POLICY "Users can view activity from their households" ON household_activity 
FOR SELECT 
USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create activity in their households" ON household_activity 
FOR INSERT 
WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()) AND user_id = auth.uid());

-- Function to switch active household
CREATE OR REPLACE FUNCTION switch_active_household(new_household_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is a member of the household
  IF NOT EXISTS (
    SELECT 1 FROM household_members 
    WHERE user_id = auth.uid() AND household_id = new_household_id
  ) THEN
    RETURN FALSE;
  END IF;

  -- Update active household
  UPDATE profiles 
  SET active_household_id = new_household_id, updated_at = NOW()
  WHERE id = auth.uid();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log household activity
CREATE OR REPLACE FUNCTION log_household_activity(
  p_household_id UUID,
  p_activity_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO household_activity (household_id, user_id, activity_type, description, metadata)
  VALUES (p_household_id, auth.uid(), p_activity_type, p_description, p_metadata)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
