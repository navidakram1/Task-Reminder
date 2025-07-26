-- Assignment History Table
CREATE TABLE assignment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  assigned_to UUID, -- References auth.users(id) but no FK constraint
  assigned_by UUID, -- References auth.users(id) but no FK constraint
  assignment_method VARCHAR(20) DEFAULT 'manual', -- 'manual', 'random', 'auto_shuffle'
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  workload_score INTEGER DEFAULT 1, -- Complexity/effort score for this task
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member Workload Tracking Table
CREATE TABLE member_workload (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID, -- References auth.users(id) but no FK constraint
  current_tasks_count INTEGER DEFAULT 0,
  completed_tasks_count INTEGER DEFAULT 0,
  total_workload_score INTEGER DEFAULT 0, -- Sum of all assigned task scores
  last_assignment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Random Assignment Settings Table
CREATE TABLE random_assignment_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  fairness_algorithm VARCHAR(20) DEFAULT 'balanced', -- 'balanced', 'round_robin', 'weighted'
  consider_workload BOOLEAN DEFAULT true,
  consider_recent_assignments BOOLEAN DEFAULT true,
  min_days_between_assignments INTEGER DEFAULT 1,
  max_consecutive_assignments INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id)
);

-- Task Complexity/Effort Scoring
CREATE TABLE task_complexity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  task_title VARCHAR(255),
  category VARCHAR(100),
  effort_score INTEGER DEFAULT 1, -- 1-5 scale (1=easy, 5=very hard)
  time_estimate INTEGER, -- Estimated minutes to complete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id, task_title)
);

-- Indexes for performance
CREATE INDEX idx_assignment_history_household ON assignment_history(household_id);
CREATE INDEX idx_assignment_history_user ON assignment_history(assigned_to);
CREATE INDEX idx_assignment_history_date ON assignment_history(assigned_at);
CREATE INDEX idx_member_workload_household ON member_workload(household_id);
CREATE INDEX idx_task_complexity_household ON task_complexity(household_id);

-- RLS Policies
ALTER TABLE assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_workload ENABLE ROW LEVEL SECURITY;
ALTER TABLE random_assignment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_complexity ENABLE ROW LEVEL SECURITY;

-- Assignment History Policies
CREATE POLICY "Users can view assignment history for their households" ON assignment_history
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert assignment history for their households" ON assignment_history
  FOR INSERT WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Member Workload Policies
CREATE POLICY "Users can view workload for their households" ON member_workload
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update workload for their households" ON member_workload
  FOR ALL USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Random Assignment Settings Policies
CREATE POLICY "Users can view settings for their households" ON random_assignment_settings
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update settings for their households" ON random_assignment_settings
  FOR ALL USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Task Complexity Policies
CREATE POLICY "Users can view complexity for their households" ON task_complexity
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage complexity for their households" ON task_complexity
  FOR ALL USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );
