-- ============================================
-- CRITICAL FIX MIGRATION
-- Date: 2025-10-27
-- Purpose: Fix missing columns and foreign keys
-- ============================================

-- Step 1: Add missing columns to tasks table
-- ============================================

-- Add priority column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'priority'
  ) THEN
    ALTER TABLE tasks
    ADD COLUMN priority TEXT
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
    DEFAULT 'medium';

    RAISE NOTICE '✅ Added priority column to tasks table';
  ELSE
    RAISE NOTICE 'ℹ️ priority column already exists';
  END IF;
END $$;

-- Add emoji column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'emoji'
  ) THEN
    ALTER TABLE tasks ADD COLUMN emoji TEXT;
    RAISE NOTICE '✅ Added emoji column to tasks table';
  ELSE
    RAISE NOTICE 'ℹ️ emoji column already exists';
  END IF;
END $$;


-- Step 2: Fix household_members foreign key relationship
-- ============================================

-- Drop existing foreign key constraint if it exists
ALTER TABLE household_members 
DROP CONSTRAINT IF EXISTS household_members_user_id_fkey;

-- Add correct foreign key to profiles table
-- This fixes the "Could not find relationship between household_members and users" error
ALTER TABLE household_members 
ADD CONSTRAINT household_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON CONSTRAINT household_members_user_id_fkey ON household_members 
IS 'Foreign key to profiles table (which references auth.users)';


-- Step 3: Ensure profiles table exists with all required columns
-- ============================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  photo_url TEXT,
  phone TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "task_reminders": true, "bill_alerts": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to profiles if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;


-- Step 4: Enable Row Level Security on profiles
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view household members profiles" ON profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to view profiles of their household members
CREATE POLICY "Users can view household members profiles" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT hm.user_id 
      FROM household_members hm
      WHERE hm.household_id IN (
        SELECT household_id 
        FROM household_members 
        WHERE user_id = auth.uid()
      )
    )
  );


-- Step 5: Create or update profile creation trigger
-- ============================================

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, display_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(profiles.name, EXCLUDED.name),
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- Step 6: Create indexes for better performance
-- ============================================

-- Index on tasks.priority for filtering
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Index on tasks.emoji for filtering
CREATE INDEX IF NOT EXISTS idx_tasks_emoji ON tasks(emoji) WHERE emoji IS NOT NULL;

-- Index on household_members.user_id for joins
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);

-- Index on profiles.email for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);


-- Step 7: Verify the changes
-- ============================================

-- Check if priority column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'priority'
  ) THEN
    RAISE NOTICE '✅ tasks.priority column exists';
  ELSE
    RAISE EXCEPTION '❌ tasks.priority column missing';
  END IF;
END $$;

-- Check if emoji column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'emoji'
  ) THEN
    RAISE NOTICE '✅ tasks.emoji column exists';
  ELSE
    RAISE EXCEPTION '❌ tasks.emoji column missing';
  END IF;
END $$;

-- Check if foreign key exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'household_members_user_id_fkey'
    AND table_name = 'household_members'
  ) THEN
    RAISE NOTICE '✅ household_members foreign key exists';
  ELSE
    RAISE EXCEPTION '❌ household_members foreign key missing';
  END IF;
END $$;


-- Step 8: Refresh PostgREST schema cache
-- ============================================

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Summary of changes:
-- 1. ✅ Added priority column to tasks table
-- 2. ✅ Added emoji column to tasks table
-- 3. ✅ Fixed household_members foreign key to profiles
-- 4. ✅ Ensured profiles table has all required columns
-- 5. ✅ Set up RLS policies for profiles
-- 6. ✅ Created profile creation trigger
-- 7. ✅ Added performance indexes
-- 8. ✅ Verified all changes

-- Next steps:
-- 1. Restart your Expo app: npx expo start --clear
-- 2. Test task creation
-- 3. Verify household members load correctly

