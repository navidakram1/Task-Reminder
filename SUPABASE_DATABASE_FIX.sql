-- 🔧 SUPABASE DATABASE FIX FOR SIGNUP ERRORS
-- This script fixes the conflicting profiles table definitions and ensures proper user signup

-- Step 1: Drop existing conflicting elements
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_user_update();
DROP VIEW IF EXISTS user_profiles;
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 2: Create the unified profiles table with all necessary columns
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  photo_url TEXT, -- For backward compatibility
  phone TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "task_reminders": true, "bill_alerts": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create comprehensive RLS policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view other profiles in their household
CREATE POLICY "Users can view household member profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_members hm1
      JOIN household_members hm2 ON hm1.household_id = hm2.household_id
      WHERE hm1.user_id = auth.uid() AND hm2.user_id = profiles.id
    )
  );

-- Step 5: Create improved trigger function for new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with error handling
  INSERT INTO profiles (
    id,
    email,
    name,
    full_name,
    avatar_url,
    photo_url,
    phone
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    COALESCE(NEW.phone, '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    photo_url = COALESCE(EXCLUDED.photo_url, profiles.photo_url),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger for profile updates
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    email = NEW.email,
    name = COALESCE(NEW.raw_user_meta_data->>'name', profiles.name),
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', profiles.full_name),
    avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', profiles.avatar_url),
    photo_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', profiles.photo_url),
    phone = COALESCE(NEW.phone, profiles.phone),
    updated_at = NOW()
  WHERE id = NEW.id;
  
  -- If profile doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO profiles (
      id, email, name, full_name, avatar_url, photo_url, phone
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', ''),
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
      COALESCE(NEW.phone, '')
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error updating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create the triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_update();

-- Step 8: Create helper functions
CREATE OR REPLACE FUNCTION get_user_profile(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  photo_url TEXT,
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
    COALESCE(p.avatar_url, au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture', '') as avatar_url,
    COALESCE(p.photo_url, p.avatar_url, au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture', '') as photo_url,
    COALESCE(p.phone, au.phone, '') as phone,
    COALESCE(p.notification_preferences, '{"email": true, "push": true, "task_reminders": true, "bill_alerts": true}'::jsonb) as notification_preferences,
    COALESCE(p.created_at, au.created_at) as created_at,
    COALESCE(p.updated_at, au.updated_at) as updated_at
  FROM auth.users au
  LEFT JOIN profiles p ON p.id = au.id
  WHERE au.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create profile update function
CREATE OR REPLACE FUNCTION update_user_profile(
  user_id UUID,
  new_name TEXT DEFAULT NULL,
  new_full_name TEXT DEFAULT NULL,
  new_avatar_url TEXT DEFAULT NULL,
  new_photo_url TEXT DEFAULT NULL,
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
    photo_url = COALESCE(new_photo_url, photo_url, avatar_url),
    phone = COALESCE(new_phone, phone),
    notification_preferences = COALESCE(new_notification_preferences, notification_preferences),
    updated_at = NOW()
  WHERE id = user_id AND id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create backward compatibility view
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  p.id,
  p.email,
  p.name,
  p.full_name,
  p.avatar_url,
  p.photo_url,
  p.phone,
  p.notification_preferences,
  p.created_at,
  p.updated_at,
  au.email_confirmed_at,
  au.last_sign_in_at,
  au.confirmed_at
FROM profiles p
JOIN auth.users au ON au.id = p.id;

-- Step 11: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Step 12: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user TO authenticated, anon;
GRANT EXECUTE ON FUNCTION handle_user_update TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated;

-- Step 13: Fix any existing auth.users without profiles
INSERT INTO profiles (id, email, name, full_name, avatar_url, photo_url, phone)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', ''),
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', ''),
  COALESCE(au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture', ''),
  COALESCE(au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture', ''),
  COALESCE(au.phone, '')
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 14: Verify the fix
DO $$
BEGIN
  RAISE NOTICE 'Database fix completed successfully!';
  RAISE NOTICE 'Profiles table: % rows', (SELECT COUNT(*) FROM profiles);
  RAISE NOTICE 'Auth users: % rows', (SELECT COUNT(*) FROM auth.users);
END $$;
