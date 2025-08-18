# 🔧 Supabase Database Fix Guide

## Problem Diagnosis

The signup error `[AuthApiError: Database error saving new user]` is caused by **conflicting profiles table definitions** in your Supabase database. There are two different schemas trying to create the same table with different column structures.

## 🚨 Root Cause

1. **Conflicting Schemas**: 
   - `supabase/schema.sql` defines profiles table with certain columns
   - `database/user_profile_trigger.sql` defines profiles table with different columns
   
2. **Missing Trigger Function**: The user signup trigger may be failing due to column mismatches

3. **RLS Policy Issues**: Row Level Security policies may be preventing profile creation

## 🛠️ Step-by-Step Fix

### Step 1: Access Supabase Dashboard

1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Navigate to your project: `ftjhtxlpjchrobftmnei`
4. Go to **SQL Editor** in the left sidebar

### Step 2: Run the Database Fix

1. **Copy the contents** of `SUPABASE_DATABASE_FIX.sql` (the file I just created)
2. **Paste it into the SQL Editor**
3. **Click "Run"** to execute the fix

This will:
- ✅ Remove conflicting table definitions
- ✅ Create a unified profiles table
- ✅ Set up proper triggers for user signup
- ✅ Configure Row Level Security policies
- ✅ Create helper functions
- ✅ Fix any existing users without profiles

### Step 3: Verify the Fix

After running the fix, execute this verification query:

```sql
-- Check if profiles table exists and has correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check if triggers exist
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';

-- Test profile creation (this should work without errors)
SELECT handle_new_user();
```

### Step 4: Test User Signup

1. **Try signing up** with a new email address in your app
2. **Check the profiles table**:
   ```sql
   SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;
   ```
3. **Verify the user was created** in both `auth.users` and `profiles`

## 🔍 Alternative Diagnosis Steps

If the fix doesn't work immediately, check these:

### Check Auth Configuration

```sql
-- Check if auth schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'auth';

-- Check auth.users table
SELECT COUNT(*) FROM auth.users;
```

### Check RLS Policies

```sql
-- List all policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
```

### Check Trigger Functions

```sql
-- List all functions related to user handling
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%user%' 
AND routine_schema = 'public';
```

## 🚀 Quick Test

After applying the fix, test with this simple signup simulation:

```sql
-- Simulate a new user signup (for testing only)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
BEGIN
    -- This simulates what happens during signup
    INSERT INTO auth.users (
        id, 
        email, 
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        test_user_id,
        'test@example.com',
        '{"name": "Test User"}'::jsonb,
        NOW(),
        NOW()
    );
    
    -- Check if profile was created automatically
    IF EXISTS (SELECT 1 FROM profiles WHERE id = test_user_id) THEN
        RAISE NOTICE 'SUCCESS: Profile created automatically for user %', test_user_id;
    ELSE
        RAISE NOTICE 'ERROR: Profile was not created for user %', test_user_id;
    END IF;
    
    -- Clean up test data
    DELETE FROM auth.users WHERE id = test_user_id;
    DELETE FROM profiles WHERE id = test_user_id;
END $$;
```

## 🔧 Manual Backup Plan

If the automated fix doesn't work, you can manually fix it:

### 1. Drop Conflicting Elements
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP TABLE IF EXISTS profiles CASCADE;
```

### 2. Recreate Profiles Table
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  phone TEXT,
  photo_url TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Enable RLS
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile" ON profiles
  USING (auth.uid() = id);
```

### 4. Create Simple Trigger
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## ✅ Success Indicators

After the fix, you should see:
- ✅ No more signup errors
- ✅ New users appear in both `auth.users` and `profiles` tables
- ✅ Profile data is properly populated
- ✅ App can access user profile information

## 🆘 If Still Having Issues

If you're still getting errors:

1. **Check Supabase logs**: Go to Logs > Database in your Supabase dashboard
2. **Verify environment variables**: Make sure your app is connecting to the right Supabase project
3. **Test with Supabase client**: Try creating a user directly through the Supabase dashboard
4. **Contact support**: Share the specific error message and logs

The database fix should resolve the signup issues and get your authentication working properly! 🎉
