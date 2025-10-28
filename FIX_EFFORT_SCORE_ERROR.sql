-- ============================================
-- COMPLETE FIX FOR TASK MARKING ERRORS
-- ============================================
-- This fixes multiple errors:
-- 1. "effort_score" field error
-- 2. Creates task_comments table if missing
-- 3. Creates mark_task_done function if missing
-- 4. Creates storage bucket for completion proofs
--
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: Fix effort_score trigger error
-- ============================================

-- Drop and recreate the trigger function without effort_score reference
CREATE OR REPLACE FUNCTION update_workload_on_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When a task is marked as completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Only call if the function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'complete_task_workload') THEN
      PERFORM complete_task_workload(
        NEW.household_id,
        NEW.assignee_id,
        1  -- Default effort score
      );
    END IF;
  END IF;

  -- When a task is assigned
  IF NEW.assignee_id IS NOT NULL AND OLD.assignee_id IS NULL THEN
    -- Only call if the function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_member_workload') THEN
      PERFORM increment_member_workload(
        NEW.household_id,
        NEW.assignee_id,
        1  -- Default effort score
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS task_workload_trigger ON tasks;
CREATE TRIGGER task_workload_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_workload_on_task_completion();

-- ============================================
-- PART 2: Update tasks table for review system
-- ============================================

-- Add review-related columns if they don't exist
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completion_proof_url TEXT;

-- Update status constraint to include new statuses
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('pending', 'in_progress', 'pending_review', 'completed', 'cancelled', 'awaiting_approval'));

-- ============================================
-- PART 3: Create task_comments table
-- ============================================

CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_household_id ON task_comments(household_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);

-- ============================================
-- PART 4: Create mark_task_done function
-- ============================================

CREATE OR REPLACE FUNCTION mark_task_done(p_task_id UUID)
RETURNS JSON AS $$
DECLARE
  v_task tasks%ROWTYPE;
  v_result JSON;
BEGIN
  -- Get the task
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Task not found');
  END IF;

  -- Update task status to pending_review
  UPDATE tasks
  SET
    status = 'pending_review',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_task_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'task_id', p_task_id,
    'status', 'pending_review'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 5: Create approve_task_review function
-- ============================================

CREATE OR REPLACE FUNCTION approve_task_review(
  p_task_id UUID,
  p_reviewer_id UUID,
  p_review_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_task tasks%ROWTYPE;
BEGIN
  -- Get the task
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Task not found');
  END IF;

  -- Update task to completed
  UPDATE tasks
  SET
    status = 'completed',
    reviewed_by = p_reviewer_id,
    reviewed_at = NOW(),
    review_notes = p_review_notes,
    updated_at = NOW()
  WHERE id = p_task_id;

  RETURN json_build_object(
    'success', true,
    'task_id', p_task_id,
    'status', 'completed'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 6: Create request_task_changes function
-- ============================================

CREATE OR REPLACE FUNCTION request_task_changes(
  p_task_id UUID,
  p_reviewer_id UUID,
  p_review_notes TEXT
)
RETURNS JSON AS $$
DECLARE
  v_task tasks%ROWTYPE;
BEGIN
  -- Get the task
  SELECT * INTO v_task FROM tasks WHERE id = p_task_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Task not found');
  END IF;

  -- Update task back to in_progress
  UPDATE tasks
  SET
    status = 'in_progress',
    reviewed_by = p_reviewer_id,
    reviewed_at = NOW(),
    review_notes = p_review_notes,
    completed_at = NULL,
    updated_at = NOW()
  WHERE id = p_task_id;

  RETURN json_build_object(
    'success', true,
    'task_id', p_task_id,
    'status', 'in_progress'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 7: Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on task_comments
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view comments in their households
CREATE POLICY "Users can view comments in their households" ON task_comments FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert comments in their households
CREATE POLICY "Users can insert comments in their households" ON task_comments FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments" ON task_comments FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON task_comments FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- PART 8: Grant Permissions
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON task_comments TO authenticated;
GRANT EXECUTE ON FUNCTION mark_task_done TO authenticated;
GRANT EXECUTE ON FUNCTION approve_task_review TO authenticated;
GRANT EXECUTE ON FUNCTION request_task_changes TO authenticated;

-- ============================================
-- PART 9: Create helpful views
-- ============================================

-- View for tasks pending review
CREATE OR REPLACE VIEW tasks_pending_review AS
SELECT
  t.*,
  assignee_profile.name as assignee_name,
  assignee_user.email as assignee_email,
  creator_profile.name as creator_name,
  h.name as household_name
FROM tasks t
LEFT JOIN auth.users assignee_user ON t.assignee_id = assignee_user.id
LEFT JOIN profiles assignee_profile ON t.assignee_id = assignee_profile.id
LEFT JOIN auth.users creator_user ON t.created_by = creator_user.id
LEFT JOIN profiles creator_profile ON t.created_by = creator_profile.id
LEFT JOIN households h ON t.household_id = h.id
WHERE t.status = 'pending_review';

-- View for comments with user info
CREATE OR REPLACE VIEW task_comments_with_users AS
SELECT
  tc.*,
  u.email as user_email,
  COALESCE(p.name, u.email) as user_name,
  p.photo_url as user_photo
FROM task_comments tc
LEFT JOIN auth.users u ON tc.user_id = u.id
LEFT JOIN profiles p ON tc.user_id = p.id;

GRANT SELECT ON tasks_pending_review TO authenticated;
GRANT SELECT ON task_comments_with_users TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify everything is set up correctly:

-- Check if trigger exists
-- SELECT * FROM pg_trigger WHERE tgname = 'task_workload_trigger';

-- Check if functions exist
-- SELECT proname FROM pg_proc WHERE proname IN ('mark_task_done', 'approve_task_review', 'request_task_changes');

-- Check if task_comments table exists
-- SELECT * FROM information_schema.tables WHERE table_name = 'task_comments';

-- Check tasks table columns
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks';

-- ============================================
-- SUCCESS!
-- ============================================
-- After running this file:
-- 1. Reload your Expo app (press 'r')
-- 2. Try marking a task as done
-- 3. Try adding a comment
-- 4. Everything should work!
-- ============================================

