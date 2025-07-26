-- Create transfer requests function for dashboard
-- This creates a simple function to handle transfer requests

-- Create transfer_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS transfer_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transfer_requests_household ON transfer_requests(household_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_to_user ON transfer_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_status ON transfer_requests(status);

-- Enable RLS
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
    CREATE POLICY "Users can view transfer requests in their household" ON transfer_requests
        FOR SELECT USING (
            household_id IN (
                SELECT household_id FROM household_members 
                WHERE user_id = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY "Users can create transfer requests" ON transfer_requests
        FOR INSERT WITH CHECK (
            from_user_id = auth.uid() AND
            household_id IN (
                SELECT household_id FROM household_members 
                WHERE user_id = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    CREATE POLICY "Users can update transfer requests to them" ON transfer_requests
        FOR UPDATE USING (
            to_user_id = auth.uid() OR from_user_id = auth.uid()
        );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create function to get pending transfer requests
CREATE OR REPLACE FUNCTION get_pending_transfer_requests()
RETURNS TABLE(
    transfer_id UUID,
    task_id UUID,
    task_title TEXT,
    from_user_id UUID,
    from_user_name TEXT,
    to_user_id UUID,
    to_user_name TEXT,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tr.id as transfer_id,
        tr.task_id,
        COALESCE(t.title, 'Unknown Task') as task_title,
        tr.from_user_id,
        COALESCE(from_profile.name, from_profile.email, 'Unknown User') as from_user_name,
        tr.to_user_id,
        COALESCE(to_profile.name, to_profile.email, 'Unknown User') as to_user_name,
        tr.message,
        tr.created_at
    FROM transfer_requests tr
    LEFT JOIN tasks t ON tr.task_id = t.id
    LEFT JOIN profiles from_profile ON tr.from_user_id = from_profile.id
    LEFT JOIN profiles to_profile ON tr.to_user_id = to_profile.id
    WHERE tr.status = 'pending'
    AND tr.household_id IN (
        SELECT household_id FROM household_members 
        WHERE user_id = auth.uid()
    )
    ORDER BY tr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to respond to transfer request
CREATE OR REPLACE FUNCTION respond_to_transfer_request(
    p_transfer_id UUID,
    p_response TEXT -- 'approved' or 'rejected'
)
RETURNS BOOLEAN AS $$
DECLARE
    transfer_record RECORD;
BEGIN
    -- Get transfer request details
    SELECT * INTO transfer_record
    FROM transfer_requests 
    WHERE id = p_transfer_id 
    AND to_user_id = auth.uid()
    AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Update transfer request status
    UPDATE transfer_requests 
    SET status = p_response, updated_at = NOW()
    WHERE id = p_transfer_id;
    
    -- If approved, transfer the task
    IF p_response = 'approved' THEN
        UPDATE tasks 
        SET assignee_id = transfer_record.to_user_id,
            updated_at = NOW()
        WHERE id = transfer_record.task_id;
    END IF;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create transfer request
CREATE OR REPLACE FUNCTION create_transfer_request(
    p_task_id UUID,
    p_to_user_id UUID,
    p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_transfer_id UUID;
    task_household_id UUID;
BEGIN
    -- Get task household
    SELECT household_id INTO task_household_id
    FROM tasks 
    WHERE id = p_task_id 
    AND assignee_id = auth.uid();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Task not found or not assigned to you';
    END IF;
    
    -- Check if target user is in same household
    IF NOT EXISTS (
        SELECT 1 FROM household_members 
        WHERE user_id = p_to_user_id 
        AND household_id = task_household_id
    ) THEN
        RAISE EXCEPTION 'Target user is not in the same household';
    END IF;
    
    -- Create transfer request
    INSERT INTO transfer_requests (
        task_id, 
        from_user_id, 
        to_user_id, 
        household_id, 
        message
    )
    VALUES (
        p_task_id,
        auth.uid(),
        p_to_user_id,
        task_household_id,
        p_message
    )
    RETURNING id INTO new_transfer_id;
    
    RETURN new_transfer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample data for testing (optional)
-- This will only work if you have existing tasks and users
/*
INSERT INTO transfer_requests (task_id, from_user_id, to_user_id, household_id, message)
SELECT 
    t.id as task_id,
    t.assignee_id as from_user_id,
    (SELECT user_id FROM household_members WHERE household_id = t.household_id AND user_id != t.assignee_id LIMIT 1) as to_user_id,
    t.household_id,
    'Can you take this task? I''m busy today.'
FROM tasks t
WHERE t.assignee_id IS NOT NULL
AND EXISTS (
    SELECT 1 FROM household_members 
    WHERE household_id = t.household_id 
    AND user_id != t.assignee_id
)
LIMIT 2;
*/
