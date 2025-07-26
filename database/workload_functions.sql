-- Function to increment member workload
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
$$ LANGUAGE plpgsql;

-- Function to complete a task and update workload
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
$$ LANGUAGE plpgsql;

-- Function to get workload balance for a household
CREATE OR REPLACE FUNCTION get_workload_balance(p_household_id UUID)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  current_tasks INTEGER,
  completed_tasks INTEGER,
  workload_score INTEGER,
  balance_ratio NUMERIC
) AS $$
DECLARE
  avg_workload NUMERIC;
BEGIN
  -- Calculate average workload
  SELECT AVG(total_workload_score) INTO avg_workload
  FROM member_workload
  WHERE household_id = p_household_id;

  -- Return workload data with balance ratios
  RETURN QUERY
  SELECT
    mw.user_id,
    COALESCE(
      (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = mw.user_id),
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = mw.user_id),
      (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = mw.user_id),
      'Unknown'
    ) as user_name,
    mw.current_tasks_count,
    mw.completed_tasks_count,
    mw.total_workload_score,
    CASE
      WHEN avg_workload > 0 THEN ROUND(mw.total_workload_score::NUMERIC / avg_workload, 2)
      ELSE 1.0
    END as balance_ratio
  FROM member_workload mw
  WHERE mw.household_id = p_household_id
  ORDER BY mw.total_workload_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get assignment history with statistics
CREATE OR REPLACE FUNCTION get_assignment_statistics(
  p_household_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  total_assignments INTEGER,
  random_assignments INTEGER,
  manual_assignments INTEGER,
  avg_workload_score NUMERIC,
  last_assignment_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ah.assigned_to as user_id,
    COALESCE(
      (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = ah.assigned_to),
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = ah.assigned_to),
      (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = ah.assigned_to),
      'Unknown'
    ) as user_name,
    COUNT(*)::INTEGER as total_assignments,
    COUNT(CASE WHEN ah.assignment_method = 'random' THEN 1 END)::INTEGER as random_assignments,
    COUNT(CASE WHEN ah.assignment_method = 'manual' THEN 1 END)::INTEGER as manual_assignments,
    ROUND(AVG(ah.workload_score), 2) as avg_workload_score,
    MAX(ah.assigned_at) as last_assignment_date
  FROM assignment_history ah
  WHERE ah.household_id = p_household_id
    AND ah.assigned_at >= NOW() - INTERVAL '%s days' % p_days
  GROUP BY ah.assigned_to
  ORDER BY total_assignments DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to suggest next assignment based on fairness
CREATE OR REPLACE FUNCTION suggest_next_assignment(p_household_id UUID)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  fairness_score NUMERIC,
  reason TEXT
) AS $$
DECLARE
  avg_workload NUMERIC;
  avg_assignments NUMERIC;
BEGIN
  -- Calculate averages
  SELECT AVG(total_workload_score) INTO avg_workload
  FROM member_workload
  WHERE household_id = p_household_id;

  SELECT AVG(assignment_count) INTO avg_assignments
  FROM (
    SELECT COUNT(*) as assignment_count
    FROM assignment_history
    WHERE household_id = p_household_id
      AND assigned_at >= NOW() - INTERVAL '30 days'
    GROUP BY assigned_to
  ) sub;

  RETURN QUERY
  SELECT
    mw.user_id,
    COALESCE(
      (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = mw.user_id),
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = mw.user_id),
      (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = mw.user_id),
      'Unknown'
    ) as user_name,
    -- Calculate fairness score (lower workload = higher score)
    CASE
      WHEN avg_workload > 0 THEN ROUND(100 - (mw.total_workload_score::NUMERIC / avg_workload * 50), 2)
      ELSE 100.0
    END as fairness_score,
    CASE
      WHEN mw.total_workload_score < COALESCE(avg_workload, 0) THEN 'Below average workload'
      WHEN mw.last_assignment_date IS NULL THEN 'Never assigned'
      WHEN mw.last_assignment_date < NOW() - INTERVAL '7 days' THEN 'Long time since last assignment'
      ELSE 'Balanced assignment candidate'
    END as reason
  FROM member_workload mw
  WHERE mw.household_id = p_household_id
  ORDER BY fairness_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update workload when tasks are completed
CREATE OR REPLACE FUNCTION update_workload_on_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a task is marked as completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM complete_task_workload(
      NEW.household_id,
      NEW.assignee_id,
      COALESCE(NEW.effort_score, 1)
    );
  END IF;
  
  -- When a task is assigned (status changes from null to something else)
  IF NEW.assignee_id IS NOT NULL AND OLD.assignee_id IS NULL THEN
    PERFORM increment_member_workload(
      NEW.household_id,
      NEW.assignee_id,
      COALESCE(NEW.effort_score, 1)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS task_workload_trigger ON tasks;
CREATE TRIGGER task_workload_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_workload_on_task_completion();
