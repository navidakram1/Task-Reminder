# 🚨 URGENT FIX GUIDE - Task Marking Error

## ❌ Error You're Seeing:

```
ERROR  Error marking task complete: {
  "code": "42703", 
  "details": null, 
  "hint": null, 
  "message": "record \"new\" has no field \"effort_score\""
}
```

---

## ✅ QUICK FIX (2 Steps)

### **Step 1: Fix Database Trigger** ⚠️ **REQUIRED!**

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy the contents of `FIX_EFFORT_SCORE_ERROR.sql`
4. Paste and click **Run**
5. Wait for "Success" message

**What this does:**
- Fixes the database trigger that's looking for a non-existent `effort_score` field
- Updates the trigger to use a default value of 1 instead

---

### **Step 2: Reload Your App**

```bash
# Press 'r' in Expo terminal
r
```

---

## 🎯 What Was Wrong?

The database has a trigger (`update_workload_on_task_completion`) that runs whenever a task status changes. This trigger was trying to access a field called `effort_score` that doesn't exist in your tasks table.

**The trigger is in:** `database/workload_functions.sql`

**The error happens when:**
- You mark a task as done
- The trigger fires
- It tries to read `NEW.effort_score`
- Field doesn't exist → ERROR!

---

## 📋 Complete Fix Steps

### **1. Run the SQL Fix**

Open `FIX_EFFORT_SCORE_ERROR.sql` and run it in Supabase SQL Editor:

```sql
-- This recreates the trigger function without effort_score
CREATE OR REPLACE FUNCTION update_workload_on_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM complete_task_workload(
      NEW.household_id,
      NEW.assignee_id,
      1  -- Default effort score
    );
  END IF;
  
  IF NEW.assignee_id IS NOT NULL AND OLD.assignee_id IS NULL THEN
    PERFORM increment_member_workload(
      NEW.household_id,
      NEW.assignee_id,
      1  -- Default effort score
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS task_workload_trigger ON tasks;
CREATE TRIGGER task_workload_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_workload_on_task_completion();
```

---

### **2. Also Run These Migrations (If Not Already Done)**

#### **A. Task Comments & Reviews Migration**

Run `supabase/migrations/task_comments_and_reviews.sql` to enable:
- Comments on tasks
- Task review system
- Approval workflow

#### **B. Storage Bucket Setup**

Run `SUPABASE_STORAGE_SETUP.sql` to enable:
- Completion proof image uploads
- Storage policies

---

### **3. Reload App**

```bash
# In Expo terminal, press:
r
```

---

## ✅ After Fix - What Should Work:

### **Task Marking:**
1. Click "Mark as Done" on a task
2. Choose to add completion proof (optional)
3. Confirm
4. ✅ **Task marked as done successfully!**
5. Task moves to "pending_review" status
6. No more errors!

### **Task Viewing:**
1. Click on any task
2. ✅ **Task details load properly**
3. See all task information
4. See comments section
5. Add comments
6. See avatars for assignee, creator, reviewer

### **Comments:**
1. Scroll to comments section
2. Type a comment
3. Click send
4. ✅ **Comment appears immediately**
5. See your avatar next to comment

---

## 🔍 Verification Steps

### **Test 1: Mark Task as Done**

1. Go to Tasks tab
2. Open a task you're assigned to
3. Click "Mark as Done"
4. Choose "Skip" (no photo for now)
5. Click "Confirm"
6. **Expected:** "Success! 🎉" message
7. **Expected:** Task disappears from your list
8. Go to Review tab
9. **Expected:** Task appears in pending review

### **Test 2: Add Comment**

1. Open any task
2. Scroll to comments section
3. Type "Test comment"
4. Click send button
5. **Expected:** Comment appears immediately
6. **Expected:** Your avatar shows next to comment

### **Test 3: View Task Details**

1. Open any task
2. **Expected:** All info displays:
   - Title with emoji
   - Status badge
   - Description
   - Assigned to (with avatar)
   - Created by (with avatar)
   - Due date
   - Priority
   - Recurrence
3. **Expected:** No errors in console

---

## 🐛 If Still Having Issues:

### **Error: "Function mark_task_done does not exist"**

**Fix:** Run `supabase/migrations/task_comments_and_reviews.sql`

This creates the `mark_task_done()` function.

---

### **Error: "Storage bucket task-proofs does not exist"**

**Fix:** 
1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name: `task-proofs`
4. Public: ✅ YES
5. Click "Create"
6. Run `SUPABASE_STORAGE_SETUP.sql`

---

### **Error: "Cannot read property 'name' of undefined"**

**Fix:** This is already fixed in the updated `[id].tsx` file.

The file now properly fetches user data with:
```typescript
assignee:assignee_id (
  id,
  name,
  email,
  photo_url
)
```

---

### **Comments Not Showing**

**Fix:** Run the migration:
```sql
-- From task_comments_and_reviews.sql
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📊 Database Migrations Checklist

Run these in order:

- [ ] **1. FIX_EFFORT_SCORE_ERROR.sql** ⚠️ **URGENT!**
- [ ] **2. supabase/migrations/task_comments_and_reviews.sql**
- [ ] **3. SUPABASE_STORAGE_SETUP.sql**

---

## 🎯 Expected Behavior After All Fixes:

### **✅ Task Details Page:**
- Loads without errors
- Shows all task information
- Displays avatars for users
- Comments section works
- Can add new comments
- Can mark as done

### **✅ Mark as Done:**
- Shows completion proof option
- Can upload image (optional)
- Shows preview of image
- Uploads to Supabase Storage
- Marks task as done
- Moves to pending_review
- No errors!

### **✅ Review Page:**
- Shows tasks pending review
- Displays assignee avatars
- Can approve/reject tasks
- Can add review notes

---

## 🚀 Quick Start After Fix:

1. **Run SQL fix** (FIX_EFFORT_SCORE_ERROR.sql)
2. **Reload app** (press 'r')
3. **Test marking a task as done**
4. **Test adding a comment**
5. **Enjoy!** 🎉

---

## 📞 Still Stuck?

Check the console logs for specific errors:

```javascript
// Look for these in Expo logs:
console.error('Error marking task done:', error)
console.error('RPC Error:', error)
console.error('Full error object:', error)
```

The error messages will tell you exactly what's missing!

---

## ✅ Success Indicators:

When everything is working, you should see:

```
✅ Task marked as done successfully
✅ Task moved to pending review
✅ Comments loading...
✅ Comments displayed
✅ Comment added successfully
✅ Avatars showing for all users
✅ No console errors
```

---

## 🎊 You're All Set!

After running the SQL fix and reloading:

- ✅ **Task marking works**
- ✅ **Comments work**
- ✅ **Task viewing works**
- ✅ **Avatars display**
- ✅ **Completion proofs work**
- ✅ **Review system works**

**Enjoy your fully functional HomeTask Reminder app!** 🚀

