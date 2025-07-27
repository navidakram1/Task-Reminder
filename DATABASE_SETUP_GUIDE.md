# 🔧 SplitDuty Database Setup & Troubleshooting

## 🚨 **Fixing "Database Error Saving New User"**

### **Step 1: Run User Profile Setup**
Execute this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of database/user_profile_trigger.sql
```

This will:
- ✅ Create a `profiles` table for user data
- ✅ Set up automatic profile creation triggers
- ✅ Enable Row Level Security (RLS)
- ✅ Create helper functions for profile management

### **Step 2: Run Assignment System Setup**
Execute this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of database/clean_assignment_schema.sql
```

This will:
- ✅ Create assignment tracking tables
- ✅ Set up workload balancing system
- ✅ Enable smart assignment features

### **Step 3: Verify Tables Created**
Check that these tables exist in your Supabase dashboard:

**Core Tables:**
- `profiles` - User profile information
- `households` - Household/group data
- `household_members` - User-household relationships
- `tasks` - Task management
- `bills` - Bill splitting
- `task_approvals` - Task verification system

**Assignment System Tables:**
- `assignment_history` - Track all assignments
- `member_workload` - Workload balancing
- `random_assignment_settings` - AI configuration
- `task_complexity` - Effort scoring

## 🔍 **Common Issues & Solutions**

### **Issue 1: "relation 'users' does not exist"**
**Solution:** The app now uses `profiles` table instead of `users`. Run the user profile setup SQL.

### **Issue 2: "permission denied for table profiles"**
**Solution:** RLS policies need to be set up. The SQL script includes all necessary policies.

### **Issue 3: "function handle_new_user() does not exist"**
**Solution:** Run the complete user profile trigger SQL script.

### **Issue 4: Sign up works but no profile created**
**Solution:** Check that the trigger is working:
```sql
-- Test if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check if profiles are being created
SELECT count(*) FROM profiles;
```

## 🧪 **Testing the Fix**

### **Test 1: User Registration**
1. Try signing up with a new email
2. Check browser console for any errors
3. Verify user appears in `auth.users` table
4. Verify profile created in `profiles` table

### **Test 2: Profile Data**
1. Sign up with name "Test User"
2. Check that name appears in profiles table:
```sql
SELECT * FROM profiles WHERE name = 'Test User';
```

### **Test 3: Authentication Flow**
1. Sign up → Should get email verification message
2. Check email and verify account
3. Sign in → Should redirect to onboarding
4. Complete onboarding → Should reach dashboard

## 📊 **Database Schema Overview**

### **User Management:**
```
auth.users (Supabase managed)
├── id (UUID)
├── email
├── raw_user_meta_data (JSON with name, etc.)
└── created_at

profiles (Our custom table)
├── id → auth.users.id
├── email
├── name
├── full_name
├── avatar_url
├── phone
├── notification_preferences (JSON)
├── created_at
└── updated_at
```

### **Household System:**
```
households
├── id (UUID)
├── name
├── admin_id → profiles.id
├── invite_code (unique)
└── created_at

household_members
├── id (UUID)
├── household_id → households.id
├── user_id → profiles.id
├── role (admin/member)
└── joined_at
```

## 🔧 **Advanced Troubleshooting**

### **Check Database Logs**
1. Go to Supabase Dashboard
2. Navigate to "Logs" section
3. Look for any error messages during sign up

### **Manual Profile Creation**
If automatic creation fails, you can manually create profiles:
```sql
INSERT INTO profiles (id, email, name, full_name)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users 
WHERE id NOT IN (SELECT id FROM profiles);
```

### **Reset and Recreate**
If you need to start fresh:
```sql
-- WARNING: This will delete all data
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS assignment_history CASCADE;
DROP TABLE IF EXISTS member_workload CASCADE;
DROP TABLE IF EXISTS random_assignment_settings CASCADE;
DROP TABLE IF EXISTS task_complexity CASCADE;

-- Then re-run the setup scripts
```

## 🎯 **Expected Behavior After Fix**

### **Sign Up Flow:**
1. User enters email, password, name
2. Supabase creates user in `auth.users`
3. Trigger automatically creates profile in `profiles`
4. User gets email verification
5. After verification, user can sign in

### **Sign In Flow:**
1. User enters credentials
2. Supabase authenticates
3. App loads user profile from `profiles` table
4. User sees dashboard or onboarding

### **Profile Management:**
1. Users can update their profile
2. Changes sync between `auth.users` and `profiles`
3. All household features work properly

## 🚀 **Next Steps After Database Fix**

1. **Test User Registration** - Try creating a new account
2. **Test Household Creation** - Create your first household
3. **Test Task Assignment** - Try the SplitDuty AI feature
4. **Test Bill Splitting** - Add and split a bill
5. **Invite Members** - Test the invitation system

## 📞 **Still Having Issues?**

If you're still experiencing problems:

1. **Check Console Logs** - Look for JavaScript errors
2. **Verify Environment Variables** - Ensure Supabase URL and keys are correct
3. **Test Database Connection** - Try a simple query in Supabase dashboard
4. **Check RLS Policies** - Ensure authenticated users have proper permissions

The database setup should now handle user registration properly and support all SplitDuty features! 🎉
