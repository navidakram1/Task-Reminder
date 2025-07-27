-- User Profile Management for SplitDuty
-- This handles automatic profile creation when users sign up

-- First, let's create a profiles table if it doesn't exist
-- This table will store additional user information beyond what's in auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "task_reminders": true, "bill_alerts": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    id,
    email,
    name,
    full_name,
    avatar_url,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.phone, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to handle profile updates when auth.users is updated
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    email = NEW.email,
    name = COALESCE(NEW.raw_user_meta_data->>'name', profiles.name),
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', profiles.full_name),
    avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', profiles.avatar_url),
    phone = COALESCE(NEW.phone, profiles.phone),
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update profile when auth.users is updated
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_update();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user TO authenticated;
GRANT EXECUTE ON FUNCTION handle_user_update TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);

-- Helper function to get user profile with fallback to auth.users
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  notification_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(p.email, au.email) as email,
    COALESCE(p.name, au.raw_user_meta_data->>'name', '') as name,
    COALESCE(p.full_name, au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', '') as full_name,
    COALESCE(p.avatar_url, au.raw_user_meta_data->>'avatar_url', '') as avatar_url,
    COALESCE(p.phone, au.phone, '') as phone,
    COALESCE(p.notification_preferences, '{"email": true, "push": true, "task_reminders": true, "bill_alerts": true}'::jsonb) as notification_preferences,
    COALESCE(p.created_at, au.created_at) as created_at,
    COALESCE(p.updated_at, au.updated_at) as updated_at
  FROM auth.users au
  LEFT JOIN profiles p ON p.id = au.id
  WHERE au.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION get_user_profile TO authenticated;

-- Update existing users table references to use profiles table
-- Note: If you have existing data in a 'users' table, you might need to migrate it

-- Create a view for backward compatibility if needed
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  p.id,
  p.email,
  p.name,
  p.full_name,
  p.avatar_url,
  p.phone,
  p.notification_preferences,
  p.created_at,
  p.updated_at,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM profiles p
JOIN auth.users au ON au.id = p.id;

-- Grant access to the view
GRANT SELECT ON user_profiles TO authenticated;

-- Function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  user_id UUID,
  new_name TEXT DEFAULT NULL,
  new_full_name TEXT DEFAULT NULL,
  new_avatar_url TEXT DEFAULT NULL,
  new_phone TEXT DEFAULT NULL,
  new_notification_preferences JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET
    name = COALESCE(new_name, name),
    full_name = COALESCE(new_full_name, full_name),
    avatar_url = COALESCE(new_avatar_url, avatar_url),
    phone = COALESCE(new_phone, phone),
    notification_preferences = COALESCE(new_notification_preferences, notification_preferences),
    updated_at = NOW()
  WHERE id = user_id AND id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated;
