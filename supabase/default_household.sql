-- Default Household Selection Feature
-- Run this in your Supabase SQL Editor

-- Add default_household_id to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_household_id UUID REFERENCES households(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_default_household ON profiles(default_household_id);

-- Function to set default household
CREATE OR REPLACE FUNCTION set_default_household(household_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is a member of the household
  IF NOT EXISTS (
    SELECT 1 FROM household_members 
    WHERE user_id = auth.uid() AND household_id = household_id
  ) THEN
    RETURN FALSE;
  END IF;

  -- Update default household and active household
  UPDATE profiles 
  SET 
    default_household_id = household_id,
    active_household_id = household_id,
    updated_at = NOW()
  WHERE id = auth.uid();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's default household
CREATE OR REPLACE FUNCTION get_default_household()
RETURNS TABLE (
  household_id UUID,
  household_name TEXT,
  invite_code TEXT,
  user_role TEXT,
  is_default BOOLEAN,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.id as household_id,
    h.name as household_name,
    h.invite_code,
    hm.role as user_role,
    (p.default_household_id = h.id) as is_default,
    (p.active_household_id = h.id) as is_active
  FROM household_members hm
  JOIN households h ON hm.household_id = h.id
  JOIN profiles p ON p.id = auth.uid()
  WHERE hm.user_id = auth.uid()
  AND (p.default_household_id = h.id OR p.default_household_id IS NULL)
  ORDER BY is_default DESC, hm.joined_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
