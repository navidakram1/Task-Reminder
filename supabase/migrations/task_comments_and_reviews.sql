-- Task Comments and Enhanced Review System
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. TASK COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_household_id ON task_comments(household_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at DESC);

-- ============================================
-- 2. ENHANCED TASK STATUS
-- ============================================

-- Update task status to include 'pending_review'
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('pending', 'in_progress', 'pending_review', 'completed', 'cancelled'));

-- Add reviewed_by and reviewed_at columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 3. RLS POLICIES FOR TASK COMMENTS
-- ============================================

-- Enable RLS
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Household members can view comments
CREATE POLICY "Household members can view task comments" ON task_comments FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Household members can create comments
CREATE POLICY "Household members can create task comments" ON task_comments FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments" ON task_comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON task_comments FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 4. FUNCTIONS FOR TASK REVIEW WORKFLOW
-- ============================================

-- Function to mark task as done (moves to pending_review)
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
    'message', 'Task marked as done and moved to pending review',
    'task_id', p_task_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve task review
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
  
  IF v_task.status != 'pending_review' THEN
    RETURN json_build_object('success', false, 'error', 'Task is not pending review');
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
    'message', 'Task approved and marked as completed',
    'task_id', p_task_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request changes on task
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
  
  IF v_task.status != 'pending_review' THEN
    RETURN json_build_object('success', false, 'error', 'Task is not pending review');
  END IF;
  
  -- Update task back to in_progress with review notes
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
    'message', 'Changes requested, task moved back to in progress',
    'task_id', p_task_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. VIEWS FOR EASY QUERYING
-- ============================================

-- View for tasks pending review with full details
CREATE OR REPLACE VIEW tasks_pending_review AS
SELECT 
  t.*,
  p_assignee.name as assignee_name,
  p_assignee.email as assignee_email,
  p_assignee.photo_url as assignee_photo,
  p_creator.name as creator_name,
  p_creator.email as creator_email,
  p_creator.photo_url as creator_photo,
  h.name as household_name
FROM tasks t
LEFT JOIN profiles p_assignee ON t.assignee_id = p_assignee.id
LEFT JOIN profiles p_creator ON t.created_by = p_creator.id
LEFT JOIN households h ON t.household_id = h.id
WHERE t.status = 'pending_review'
ORDER BY t.completed_at DESC;

-- View for task comments with user info
CREATE OR REPLACE VIEW task_comments_with_users AS
SELECT 
  tc.*,
  p.name as user_name,
  p.email as user_email,
  p.photo_url as user_photo
FROM task_comments tc
LEFT JOIN profiles p ON tc.user_id = p.id
ORDER BY tc.created_at ASC;

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Trigger to update updated_at on task_comments
CREATE OR REPLACE FUNCTION update_task_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_comments_updated_at
  BEFORE UPDATE ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_task_comments_updated_at();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON task_comments TO authenticated;
GRANT EXECUTE ON FUNCTION mark_task_done TO authenticated;
GRANT EXECUTE ON FUNCTION approve_task_review TO authenticated;
GRANT EXECUTE ON FUNCTION request_task_changes TO authenticated;
GRANT SELECT ON tasks_pending_review TO authenticated;
GRANT SELECT ON task_comments_with_users TO authenticated;

