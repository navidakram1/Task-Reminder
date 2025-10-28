# 🚀 Quick Start: Auto-Approval System

## ⚡ 3-Minute Setup

### Step 1: Run SQL Migration (2 minutes)

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query" button

3. **Copy & Run Migration**
   - Open file: `FIX_EFFORT_SCORE_ERROR.sql`
   - Copy ALL 478 lines
   - Paste into SQL Editor
   - Click "RUN" button

4. **Verify Success**
   - Should see: ✅ "Success. No rows returned"

### Step 2: Reload App (1 minute)

1. **In Expo Terminal:**
   ```
   Press 'r' to reload
   ```

2. **Or Restart:**
   ```
   npx expo start --clear
   ```

### Step 3: Test It! (30 seconds)

1. Go to **Tasks** tab
2. Pull down to refresh
3. Look for tasks with "pending_review" status
4. You'll see: **🕐 Auto-approves in: 2d 5h 30m**

---

## 🎯 What You'll See

### Task Card with Countdown

```
┌──────────────────────────────────────────────┐
│ 📋 Clean the Kitchen            [Pending]   │
│                                              │
│ Wipe counters and mop floor                 │
│                                              │
│ 📅 Due: Jan 15  🔄 Weekly                   │
│ ──────────────────────────────────────────── │
│ 🕐 Auto-approves in: 2d 5h 30m              │
│    (Green background)                        │
└──────────────────────────────────────────────┘
```

### Color Changes Based on Time

**>2 Days Remaining:**
```
🕐 Auto-approves in: 2d 15h 30m
(Green background #10b98115, green text #10b981)
```

**1-2 Days Remaining:**
```
🕐 Auto-approves in: 1d 8h 45m
(Yellow background #f59e0b15, yellow text #f59e0b)
```

**<1 Day Remaining:**
```
🕐 Auto-approves in: 18h 20m
(Orange background #f9731615, orange text #f97316)
```

**Expired (Auto-Approving):**
```
✅ Auto-approving...
(Green background #10b98115, green text #10b981)
```

---

## 🧪 Quick Test

### Create a Test Task

**Option 1: In Supabase Dashboard**
```sql
-- Create a task that will auto-approve in 1 hour
UPDATE tasks 
SET 
  status = 'pending_review',
  pending_review_since = NOW() - INTERVAL '2 days 23 hours'
WHERE id = (SELECT id FROM tasks LIMIT 1);
```

**Option 2: In the App**
1. Mark any task as complete
2. Add a photo proof (optional)
3. Task enters pending_review status
4. Countdown starts automatically

### Manually Trigger Auto-Approval

**In Supabase SQL Editor:**
```sql
SELECT auto_approve_expired_reviews();
```

**Result:**
- Returns number of tasks auto-approved
- Example: `1` (approved 1 task)

---

## 📊 How It Works

### Timeline

```
Day 0 (Now)
  ↓
Task marked complete → Status: pending_review
  ↓
pending_review_since = NOW()
  ↓
Countdown starts: "Auto-approves in: 3d 0h 0m"
  ↓
Day 1
  ↓
Countdown: "Auto-approves in: 2d 0h 0m" (Green)
  ↓
Day 2
  ↓
Countdown: "Auto-approves in: 1d 0h 0m" (Yellow)
  ↓
Day 3
  ↓
Countdown: "Auto-approves in: 12h 0m" (Orange)
  ↓
After 72 hours
  ↓
Auto-approval triggered
  ↓
Status: completed ✅
review_notes: "Auto-approved after 3 days"
```

### Automatic Triggers

**When does auto-approval run?**

1. **App Start** - When you open the app
2. **Pull to Refresh** - When you refresh the task list
3. **Manual** - When you run SQL command

**How often does countdown update?**
- Every 60 seconds (1 minute)
- Automatically in the background
- No action needed

---

## 🔍 Monitoring

### Check All Pending Reviews

**In Supabase SQL Editor:**
```sql
SELECT * FROM tasks_pending_review_with_countdown;
```

**Shows:**
- Task ID and title
- When review started
- Seconds until auto-approval
- Review status (PENDING or EXPIRED)

### Check Recently Auto-Approved Tasks

```sql
SELECT 
  id, 
  title, 
  status, 
  review_notes, 
  reviewed_at
FROM tasks
WHERE review_notes = 'Auto-approved after 3 days'
ORDER BY reviewed_at DESC
LIMIT 10;
```

---

## ❓ Troubleshooting

### Countdown Not Showing?

**Check 1: Task Status**
```sql
SELECT id, title, status, pending_review_since 
FROM tasks 
WHERE id = 'your-task-id';
```
- Status should be `pending_review`
- `pending_review_since` should not be NULL

**Check 2: SQL Migration**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND column_name = 'pending_review_since';
```
- Should return 1 row
- If empty, run SQL migration again

**Check 3: App Reload**
- Press `r` in terminal
- Or restart: `npx expo start --clear`

### Auto-Approval Not Working?

**Test Manually:**
```sql
-- Create expired task
UPDATE tasks 
SET 
  status = 'pending_review',
  pending_review_since = NOW() - INTERVAL '3 days 1 hour'
WHERE id = 'test-task-id';

-- Trigger auto-approval
SELECT auto_approve_expired_reviews();

-- Check result
SELECT status, review_notes FROM tasks WHERE id = 'test-task-id';
```

**Expected Result:**
- Status: `completed`
- review_notes: `Auto-approved after 3 days`

### Function Not Found?

**Check if function exists:**
```sql
SELECT proname 
FROM pg_proc 
WHERE proname = 'auto_approve_expired_reviews';
```

**If empty:**
- Run SQL migration again
- Make sure you copied ALL 478 lines

---

## 🎨 Customization

### Change Duration (e.g., 7 days instead of 3)

**1. Update SQL Function:**
```sql
CREATE OR REPLACE FUNCTION auto_approve_expired_reviews()
RETURNS INTEGER AS $$
BEGIN
  UPDATE tasks
  SET status = 'completed', reviewed_at = NOW(), 
      review_notes = 'Auto-approved after 7 days'
  WHERE status = 'pending_review'
    AND pending_review_since <= NOW() - INTERVAL '7 days';
  RETURN ROW_COUNT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**2. Update ReviewCountdown.tsx:**
```typescript
const REVIEW_DURATION_DAYS = 7  // Line 23
```

**3. Reload app**

### Change Colors

**Edit `components/tasks/ReviewCountdown.tsx`:**
```typescript
const getUrgencyColor = () => {
  const hoursRemaining = timeRemaining.totalSeconds / 3600
  if (hoursRemaining > 120) return '#10b981'  // Green (>5 days)
  if (hoursRemaining > 48) return '#f59e0b'   // Yellow (2-5 days)
  return '#f97316'  // Orange (<2 days)
}
```

---

## 📚 Documentation

**Full Documentation:**
- `AUTO_APPROVAL_SYSTEM.md` - Complete technical documentation
- `AUTO_APPROVAL_IMPLEMENTATION_SUMMARY.md` - Implementation details
- `QUICK_START_AUTO_APPROVAL.md` - This file

**SQL File:**
- `FIX_EFFORT_SCORE_ERROR.sql` - Database migration (478 lines)

**Code Files:**
- `components/tasks/ReviewCountdown.tsx` - Countdown component
- `utils/autoApprovalHelper.ts` - Helper functions
- `app/(app)/tasks/index.tsx` - Task list with countdown

---

## ✅ Success Checklist

After setup, verify:

- [ ] SQL migration ran successfully
- [ ] App reloaded without errors
- [ ] Countdown appears for pending_review tasks
- [ ] Countdown shows correct time format
- [ ] Colors change based on urgency
- [ ] Pull-to-refresh works
- [ ] Auto-approval works (test with expired task)

---

## 🆘 Need Help?

**Common Issues:**

1. **"Function doesn't exist"**
   - Re-run SQL migration
   - Check you copied all 478 lines

2. **"Countdown not showing"**
   - Check task status is `pending_review`
   - Check `pending_review_since` is not NULL
   - Reload app with `r`

3. **"Colors not changing"**
   - Wait for countdown to update (every 60 seconds)
   - Or pull to refresh

4. **"Auto-approval not triggering"**
   - Pull to refresh (triggers auto-approval)
   - Or manually run: `SELECT auto_approve_expired_reviews();`

---

**That's it! Your auto-approval system is ready to use!** 🎉

**Next Steps:**
1. Run SQL migration
2. Reload app
3. Test with a task
4. Enjoy automatic approvals!

