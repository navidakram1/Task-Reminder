-- Task Transfer System
-- Run this in your Supabase SQL Editor

-- Create task_transfer_requests table
CREATE TABLE IF NOT EXISTS task_transfer_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_transfer_requests_task_id ON task_transfer_requests(task_id);
CREATE INDEX IF NOT EXISTS idx_task_transfer_requests_to_user ON task_transfer_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_task_transfer_requests_status ON task_transfer_requests(status);

-- Enable RLS
ALTER TABLE task_transfer_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_transfer_requests
CREATE POLICY "Users can view transfer requests involving them" ON task_transfer_requests 
FOR SELECT 
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can create transfer requests for their tasks" ON task_transfer_requests 
FOR INSERT 
WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update transfer requests sent to them" ON task_transfer_requests 
FOR UPDATE 
USING (to_user_id = auth.uid())
WITH CHECK (to_user_id = auth.uid());

-- Function to create a task transfer request
CREATE OR REPLACE FUNCTION create_task_transfer_request(
  p_task_id UUID,
  p_to_user_id UUID,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  transfer_id UUID;
  task_record RECORD;
BEGIN
  -- Check if the task exists and user has permission
  SELECT * INTO task_record FROM tasks WHERE id = p_task_id AND assignee_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found or you are not assigned to this task';
  END IF;

  -- Check if there's already a pending transfer request for this task
  IF EXISTS (
    SELECT 1 FROM task_transfer_requests 
    WHERE task_id = p_task_id AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'There is already a pending transfer request for this task';
  END IF;

  -- Create the transfer request
  INSERT INTO task_transfer_requests (task_id, from_user_id, to_user_id, message)
  VALUES (p_task_id, auth.uid(), p_to_user_id, p_message)
  RETURNING id INTO transfer_id;

  -- Update task status to indicate transfer is requested
  UPDATE tasks 
  SET status = 'transfer_requested' 
  WHERE id = p_task_id;

  -- Log activity
  INSERT INTO household_activity (household_id, user_id, activity_type, description, metadata)
  VALUES (
    task_record.household_id,
    auth.uid(),
    'task_transfer_requested',
    'Requested to transfer task: ' || task_record.title,
    jsonb_build_object('task_id', p_task_id, 'to_user_id', p_to_user_id, 'transfer_id', transfer_id)
  );

  RETURN transfer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to respond to a task transfer request
CREATE OR REPLACE FUNCTION respond_to_task_transfer(
  p_transfer_id UUID,
  p_response TEXT -- 'accepted' or 'rejected'
)
RETURNS BOOLEAN AS $$
DECLARE
  transfer_record RECORD;
  task_record RECORD;
BEGIN
  -- Get the transfer request
  SELECT * INTO transfer_record 
  FROM task_transfer_requests 
  WHERE id = p_transfer_id AND to_user_id = auth.uid() AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer request not found or you do not have permission to respond';
  END IF;

  -- Get the task
  SELECT * INTO task_record FROM tasks WHERE id = transfer_record.task_id;

  -- Update the transfer request
  UPDATE task_transfer_requests 
  SET 
    status = p_response,
    responded_at = NOW()
  WHERE id = p_transfer_id;

  IF p_response = 'accepted' THEN
    -- Transfer the task to the new user
    UPDATE tasks 
    SET 
      assignee_id = transfer_record.to_user_id,
      status = 'pending'
    WHERE id = transfer_record.task_id;

    -- Log activity for acceptance
    INSERT INTO household_activity (household_id, user_id, activity_type, description, metadata)
    VALUES (
      task_record.household_id,
      auth.uid(),
      'task_transfer_accepted',
      'Accepted transfer of task: ' || task_record.title,
      jsonb_build_object('task_id', transfer_record.task_id, 'from_user_id', transfer_record.from_user_id, 'transfer_id', p_transfer_id)
    );
  ELSE
    -- Rejected - revert task status to pending
    UPDATE tasks 
    SET status = 'pending'
    WHERE id = transfer_record.task_id;

    -- Log activity for rejection
    INSERT INTO household_activity (household_id, user_id, activity_type, description, metadata)
    VALUES (
      task_record.household_id,
      auth.uid(),
      'task_transfer_rejected',
      'Rejected transfer of task: ' || task_record.title,
      jsonb_build_object('task_id', transfer_record.task_id, 'from_user_id', transfer_record.from_user_id, 'transfer_id', p_transfer_id)
    );
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending transfer requests for a user
CREATE OR REPLACE FUNCTION get_pending_transfer_requests()
RETURNS TABLE (
  transfer_id UUID,
  task_id UUID,
  task_title TEXT,
  task_description TEXT,
  from_user_name TEXT,
  from_user_email TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ttr.id as transfer_id,
    t.id as task_id,
    t.title as task_title,
    t.description as task_description,
    p.name as from_user_name,
    p.email as from_user_email,
    ttr.message,
    ttr.created_at
  FROM task_transfer_requests ttr
  JOIN tasks t ON ttr.task_id = t.id
  JOIN profiles p ON ttr.from_user_id = p.id
  WHERE ttr.to_user_id = auth.uid() 
  AND ttr.status = 'pending'
  ORDER BY ttr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
