-- Simple Assignment Tracking Schema for Supabase
-- This version works with Supabase's auth system without complex foreign keys

-- Assignment History Table (simplified)
CREATE TABLE IF NOT EXISTS assignment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  assigned_to UUID, -- References auth.users(id)
  assigned_by UUID, -- References auth.users(id)
  assignment_method VARCHAR(20) DEFAULT 'manual',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  workload_score INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member Workload Tracking Table (simplified)
CREATE TABLE IF NOT EXISTS member_workload (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID, -- References auth.users(id)
  current_tasks_count INTEGER DEFAULT 0,
  completed_tasks_count INTEGER DEFAULT 0,
  total_workload_score INTEGER DEFAULT 0,
  last_assignment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Random Assignment Settings Table
CREATE TABLE IF NOT EXISTS random_assignment_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  fairness_algorithm VARCHAR(20) DEFAULT 'balanced',
  consider_workload BOOLEAN DEFAULT true,
  consider_recent_assignments BOOLEAN DEFAULT true,
  min_days_between_assignments INTEGER DEFAULT 1,
  max_consecutive_assignments INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id)
);

-- Task Complexity/Effort Scoring
CREATE TABLE IF NOT EXISTS task_complexity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  task_title VARCHAR(255),
  category VARCHAR(100),
  effort_score INTEGER DEFAULT 1,
  time_estimate INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id, task_title)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignment_history_household ON assignment_history(household_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_user ON assignment_history(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignment_history_date ON assignment_history(assigned_at);
CREATE INDEX IF NOT EXISTS idx_member_workload_household ON member_workload(household_id);
CREATE INDEX IF NOT EXISTS idx_member_workload_user ON member_workload(user_id);
CREATE INDEX IF NOT EXISTS idx_task_complexity_household ON task_complexity(household_id);

-- Enable Row Level Security
ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_workload ENABLE ROW LEVEL SECURITY;
ALTER TABLE random_assignment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_complexity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignment_history
DROP POLICY IF EXISTS "Users can view assignment history for their households" ON assignment_history;
CREATE POLICY "Users can view assignment history for their households" ON assignment_history
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert assignment history for their households" ON assignment_history;
CREATE POLICY "Users can insert assignment history for their households" ON assignment_history
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for member_workload
DROP POLICY IF EXISTS "Users can view workload for their households" ON member_workload;
CREATE POLICY "Users can view workload for their households" ON member_workload
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage workload for their households" ON member_workload;
CREATE POLICY "Users can manage workload for their households" ON member_workload
  FOR ALL USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for random_assignment_settings
DROP POLICY IF EXISTS "Users can view settings for their households" ON random_assignment_settings;
CREATE POLICY "Users can view settings for their households" ON random_assignment_settings
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update settings for their households" ON random_assignment_settings;
CREATE POLICY "Users can update settings for their households" ON random_assignment_settings
  FOR ALL USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for task_complexity
DROP POLICY IF EXISTS "Users can view complexity for their households" ON task_complexity;
CREATE POLICY "Users can view complexity for their households" ON task_complexity
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage complexity for their households" ON task_complexity;
CREATE POLICY "Users can manage complexity for their households" ON task_complexity
  FOR ALL USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Simple function to increment member workload (without complex auth.users joins)
CREATE OR REPLACE FUNCTION increment_member_workload(
  p_household_id UUID,
  p_user_id UUID,
  p_workload_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO member_workload (
    household_id,
    user_id,
    current_tasks_count,
    total_workload_score,
    last_assignment_date,
    updated_at
  )
  VALUES (
    p_household_id,
    p_user_id,
    1,
    p_workload_increment,
    NOW(),
    NOW()
  )
  ON CONFLICT (household_id, user_id)
  DO UPDATE SET
    current_tasks_count = member_workload.current_tasks_count + 1,
    total_workload_score = member_workload.total_workload_score + p_workload_increment,
    last_assignment_date = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple function to complete a task and update workload
CREATE OR REPLACE FUNCTION complete_task_workload(
  p_household_id UUID,
  p_user_id UUID,
  p_workload_score INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE member_workload
  SET
    current_tasks_count = GREATEST(0, current_tasks_count - 1),
    completed_tasks_count = completed_tasks_count + 1,
    total_workload_score = GREATEST(0, total_workload_score - p_workload_score),
    updated_at = NOW()
  WHERE household_id = p_household_id AND user_id = p_user_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO member_workload (
      household_id,
      user_id,
      current_tasks_count,
      completed_tasks_count,
      total_workload_score,
      updated_at
    )
    VALUES (
      p_household_id,
      p_user_id,
      0,
      1,
      0,
      NOW()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON assignment_history TO authenticated;
GRANT ALL ON member_workload TO authenticated;
GRANT ALL ON random_assignment_settings TO authenticated;
GRANT ALL ON task_complexity TO authenticated;
GRANT EXECUTE ON FUNCTION increment_member_workload TO authenticated;
GRANT EXECUTE ON FUNCTION complete_task_workload TO authenticated;
