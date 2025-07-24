-- Fix Foreign Key Relationships for Supabase PostgREST
-- Run this in your Supabase SQL Editor

-- First, ensure all foreign key constraints exist
-- These should already exist from the schema, but let's make sure

-- Fix tasks table foreign keys
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;
ALTER TABLE tasks ADD CONSTRAINT tasks_assignee_id_fkey 
FOREIGN KEY (assignee_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;
ALTER TABLE tasks ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix bills table foreign keys
ALTER TABLE bills DROP CONSTRAINT IF EXISTS bills_paid_by_fkey;
ALTER TABLE bills ADD CONSTRAINT bills_paid_by_fkey 
FOREIGN KEY (paid_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix task_approvals table foreign keys
ALTER TABLE task_approvals DROP CONSTRAINT IF EXISTS task_approvals_submitted_by_fkey;
ALTER TABLE task_approvals ADD CONSTRAINT task_approvals_submitted_by_fkey 
FOREIGN KEY (submitted_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE task_approvals DROP CONSTRAINT IF EXISTS task_approvals_reviewed_by_fkey;
ALTER TABLE task_approvals ADD CONSTRAINT task_approvals_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix household_members table foreign keys
ALTER TABLE household_members DROP CONSTRAINT IF EXISTS household_members_user_id_fkey;
ALTER TABLE household_members ADD CONSTRAINT household_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create views to help with relationships (alternative approach)
-- This creates a view that PostgREST can use for relationships

-- View for tasks with assignee info
CREATE OR REPLACE VIEW tasks_with_assignee AS
SELECT 
  t.*,
  p.name as assignee_name,
  p.email as assignee_email,
  cp.name as created_by_name,
  cp.email as created_by_email
FROM tasks t
LEFT JOIN profiles p ON t.assignee_id = p.id
LEFT JOIN profiles cp ON t.created_by = cp.id;

-- View for bills with payer info
CREATE OR REPLACE VIEW bills_with_payer AS
SELECT 
  b.*,
  p.name as paid_by_name,
  p.email as paid_by_email
FROM bills b
LEFT JOIN profiles p ON b.paid_by = p.id;

-- View for task approvals with user info
CREATE OR REPLACE VIEW task_approvals_with_users AS
SELECT 
  ta.*,
  sp.name as submitted_by_name,
  sp.email as submitted_by_email,
  rp.name as reviewed_by_name,
  rp.email as reviewed_by_email,
  t.title as task_title,
  t.description as task_description
FROM task_approvals ta
LEFT JOIN profiles sp ON ta.submitted_by = sp.id
LEFT JOIN profiles rp ON ta.reviewed_by = rp.id
LEFT JOIN tasks t ON ta.task_id = t.id;

-- View for household members with profile info
CREATE OR REPLACE VIEW household_members_with_profiles AS
SELECT 
  hm.*,
  p.name,
  p.email,
  p.photo_url,
  h.name as household_name,
  h.invite_code
FROM household_members hm
LEFT JOIN profiles p ON hm.user_id = p.id
LEFT JOIN households h ON hm.household_id = h.id;

-- Grant permissions on views
GRANT SELECT ON tasks_with_assignee TO authenticated;
GRANT SELECT ON bills_with_payer TO authenticated;
GRANT SELECT ON task_approvals_with_users TO authenticated;
GRANT SELECT ON household_members_with_profiles TO authenticated;

-- Enable RLS on views
ALTER VIEW tasks_with_assignee SET (security_invoker = true);
ALTER VIEW bills_with_payer SET (security_invoker = true);
ALTER VIEW task_approvals_with_users SET (security_invoker = true);
ALTER VIEW household_members_with_profiles SET (security_invoker = true);

-- Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';
