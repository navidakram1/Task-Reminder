-- Recurring Tasks System Setup
-- Run this SQL in your Supabase SQL Editor

-- Add columns to support recurring task generation
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS last_generated TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence ON tasks(recurrence) WHERE recurrence IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_is_template ON tasks(is_template) WHERE is_template = TRUE;

-- Function to generate next recurring task instance
CREATE OR REPLACE FUNCTION generate_recurring_task_instance(
  original_task_id UUID,
  next_due_date DATE
)
RETURNS UUID AS $$
DECLARE
  original_task RECORD;
  new_task_id UUID;
BEGIN
  -- Get the original task details
  SELECT * INTO original_task
  FROM tasks
  WHERE id = original_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Original task not found: %', original_task_id;
  END IF;

  -- Create new task instance
  INSERT INTO tasks (
    household_id,
    title,
    description,
    due_date,
    assignee_id,
    created_by,
    emoji,
    status,
    parent_task_id,
    recurrence,
    is_template
  ) VALUES (
    original_task.household_id,
    original_task.title,
    original_task.description,
    next_due_date,
    original_task.assignee_id,
    original_task.created_by,
    original_task.emoji,
    'pending',
    original_task_id,
    NULL, -- New instances are not recurring themselves
    FALSE
  ) RETURNING id INTO new_task_id;

  -- Update the original task's last_generated timestamp
  UPDATE tasks
  SET last_generated = next_due_date::timestamp
  WHERE id = original_task_id;

  RETURN new_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate next due date based on recurrence
CREATE OR REPLACE FUNCTION calculate_next_due_date(
  last_date DATE,
  recurrence_type TEXT
)
RETURNS DATE AS $$
BEGIN
  CASE recurrence_type
    WHEN 'daily' THEN
      RETURN last_date + INTERVAL '1 day';
    WHEN 'weekly' THEN
      RETURN last_date + INTERVAL '1 week';
    WHEN 'monthly' THEN
      RETURN last_date + INTERVAL '1 month';
    ELSE
      RAISE EXCEPTION 'Unknown recurrence type: %', recurrence_type;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate all pending recurring tasks
CREATE OR REPLACE FUNCTION generate_pending_recurring_tasks()
RETURNS INTEGER AS $$
DECLARE
  task_record RECORD;
  next_due_date DATE;
  generated_count INTEGER := 0;
  existing_task_id UUID;
BEGIN
  -- Process all recurring tasks that need new instances
  FOR task_record IN
    SELECT *
    FROM tasks
    WHERE recurrence IS NOT NULL
    AND (is_template = TRUE OR status = 'completed')
  LOOP
    -- Calculate next due date
    next_due_date := calculate_next_due_date(
      COALESCE(task_record.last_generated::date, task_record.due_date, CURRENT_DATE),
      task_record.recurrence
    );

    -- Only generate if the due date is today or in the past
    WHILE next_due_date <= CURRENT_DATE LOOP
      -- Check if an instance already exists for this date
      SELECT id INTO existing_task_id
      FROM tasks
      WHERE parent_task_id = task_record.id
      AND due_date = next_due_date;

      -- Generate new instance if it doesn't exist
      IF existing_task_id IS NULL THEN
        PERFORM generate_recurring_task_instance(task_record.id, next_due_date);
        generated_count := generated_count + 1;
      END IF;

      -- Calculate next occurrence
      next_due_date := calculate_next_due_date(next_due_date, task_record.recurrence);
    END LOOP;

    -- Generate one future instance for continuity
    SELECT id INTO existing_task_id
    FROM tasks
    WHERE parent_task_id = task_record.id
    AND due_date = next_due_date;

    IF existing_task_id IS NULL THEN
      PERFORM generate_recurring_task_instance(task_record.id, next_due_date);
      generated_count := generated_count + 1;
    END IF;
  END LOOP;

  RETURN generated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark a recurring task as template
CREATE OR REPLACE FUNCTION mark_task_as_template(task_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE tasks
  SET is_template = TRUE,
      status = 'completed' -- Templates are considered "completed" to avoid showing in active lists
  WHERE id = task_id
  AND recurrence IS NOT NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recurring task instances
CREATE OR REPLACE FUNCTION get_recurring_task_instances(parent_task_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  due_date DATE,
  status TEXT,
  assignee_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.due_date,
    t.status,
    p.name as assignee_name,
    t.created_at
  FROM tasks t
  LEFT JOIN profiles p ON t.assignee_id = p.id
  WHERE t.parent_task_id = parent_task_id
  ORDER BY t.due_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recurring task statistics
CREATE OR REPLACE FUNCTION get_recurring_task_stats(household_id UUID)
RETURNS TABLE (
  total_recurring_tasks INTEGER,
  active_instances INTEGER,
  completed_instances INTEGER,
  overdue_instances INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM tasks WHERE household_id = household_id AND recurrence IS NOT NULL AND is_template = TRUE) as total_recurring_tasks,
    (SELECT COUNT(*)::INTEGER FROM tasks WHERE household_id = household_id AND parent_task_id IS NOT NULL AND status = 'pending') as active_instances,
    (SELECT COUNT(*)::INTEGER FROM tasks WHERE household_id = household_id AND parent_task_id IS NOT NULL AND status = 'completed') as completed_instances,
    (SELECT COUNT(*)::INTEGER FROM tasks WHERE household_id = household_id AND parent_task_id IS NOT NULL AND status = 'pending' AND due_date < CURRENT_DATE) as overdue_instances;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically mark recurring tasks as templates when they're first completed
CREATE OR REPLACE FUNCTION auto_mark_recurring_template()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a recurring task being completed for the first time
  IF NEW.status = 'completed' 
     AND OLD.status != 'completed' 
     AND NEW.recurrence IS NOT NULL 
     AND NEW.is_template = FALSE THEN
    
    -- Mark as template
    NEW.is_template := TRUE;
    
    -- Generate the next instance immediately
    PERFORM generate_recurring_task_instance(NEW.id, calculate_next_due_date(COALESCE(NEW.due_date, CURRENT_DATE), NEW.recurrence));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_recurring_template_trigger ON tasks;
CREATE TRIGGER auto_recurring_template_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_mark_recurring_template();

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_recurring_task_instance(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_due_date(DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_pending_recurring_tasks() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_task_as_template(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recurring_task_instances(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recurring_task_stats(UUID) TO authenticated;

-- Grant service role permissions for automated generation
GRANT EXECUTE ON FUNCTION generate_pending_recurring_tasks() TO service_role;
GRANT EXECUTE ON FUNCTION generate_recurring_task_instance(UUID, DATE) TO service_role;
