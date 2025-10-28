-- ============================================
-- SIMPLE FIX - Run this in Supabase SQL Editor
-- ============================================
-- This adds the missing columns that your app needs
-- Time: 30 seconds
-- ============================================

-- 1. Add priority column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS priority TEXT 
CHECK (priority IN ('low', 'medium', 'high', 'urgent')) 
DEFAULT 'medium';

-- 2. Add emoji column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS emoji TEXT;

-- 3. Fix household_members foreign key to use profiles
ALTER TABLE household_members 
DROP CONSTRAINT IF EXISTS household_members_user_id_fkey;

ALTER TABLE household_members 
ADD CONSTRAINT household_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 4. Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================
-- DONE! Now restart your Expo app:
-- npx expo start --clear
-- ============================================

