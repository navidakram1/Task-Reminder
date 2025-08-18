# 🔧 Database Error Fix Guide

## Issue: "Database error saving new user"

This error occurs when users try to sign up because the database triggers for automatic profile creation are not set up properly.

## Quick Fix

Run this SQL in your Supabase SQL Editor:

```sql
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    id,
    email,
    name,
    notification_preferences
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    '{"email": true, "push": true, "task_reminders": true, "bill_alerts": true}'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user TO authenticated;
```

## Alternative: Manual Profile Creation

If you prefer to handle profile creation in the app code instead of database triggers, the AuthContext has been updated to create profiles manually.

## Verification

After running the SQL:

1. Try signing up a new user
2. Check the `profiles` table to see if the profile was created automatically
3. The error should be resolved

## Database Schema Check

Make sure your `profiles` table exists with this structure:

```sql
-- Check if profiles table exists
SELECT * FROM information_schema.tables WHERE table_name = 'profiles';

-- If it doesn't exist, create it:
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "task_reminders": true, "bill_alerts": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## Testing

1. Go to the signup screen
2. Create a new account
3. The signup should complete successfully
4. Check the Supabase dashboard to confirm the profile was created

The error should now be resolved! 🎉
