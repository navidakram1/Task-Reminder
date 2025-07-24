-- Add Captain Role to Household Members
-- Run this in your Supabase SQL Editor

-- First, drop the existing constraint
ALTER TABLE household_members DROP CONSTRAINT IF EXISTS household_members_role_check;

-- Add the new constraint with captain role
ALTER TABLE household_members ADD CONSTRAINT household_members_role_check 
CHECK (role IN ('admin', 'captain', 'member'));

-- Update any existing data if needed (optional)
-- UPDATE household_members SET role = 'captain' WHERE role = 'member' AND user_id IN (SELECT user_id FROM some_condition);
