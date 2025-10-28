# ✅ Automatic Task Review Expiration System

## Overview

The automatic task review expiration system automatically approves tasks that have been in `pending_review` status for more than 3 days (72 hours). This prevents tasks from being stuck in review indefinitely and ensures smooth workflow.

---

## Features Implemented

### 1. ✅ Auto-Approval After 3 Days
- **Trigger:** When a task enters `pending_review` status
- **Duration:** 3 days (72 hours)
- **Action:** Automatically changes status from `pending_review` to `completed`
- **Implementation:** PostgreSQL function + triggers

### 2. ✅ Countdown Display in Task List
- **Location:** Task cards in `app/(app)/tasks/index.tsx`
- **Format:** "Auto-approves in: 2d 5h 30m"
- **Updates:** Real-time countdown (updates every minute)
- **Visibility:** Only shown for tasks with `pending_review` status

### 3. ✅ Database Changes
- **New Column:** `pending_review_since` (TIMESTAMP WITH TIME ZONE)
- **Function:** `auto_approve_expired_reviews()` - Auto-approves expired reviews
- **Triggers:** 
  - `set_pending_review_timestamp_trigger` - Sets timestamp on UPDATE
  - `set_pending_review_timestamp_insert_trigger` - Sets timestamp on INSERT
- **View:** `tasks_pending_review_with_countdown` - Helper view for monitoring

### 4. ✅ Visual Indicators
- **Color Scheme:**
  - 🟢 **Green** - More than 2 days remaining
  - 🟡 **Yellow** - 1-2 days remaining
  - 🟠 **Orange** - Less than 1 day remaining
  - ✅ **Green checkmark** - Expired (auto-approving)
- **Icon:** Clock icon for countdown, checkmark for expired
- **Position:** Below task metadata, above quick actions

### 5. ✅ SQL Migration Updated
- **File:** `FIX_EFFORT_SCORE_ERROR.sql`
- **Added:** 
  - `pending_review_since` column
  - Auto-approval function
  - Triggers for timestamp management
  - Helper view for monitoring

---

## How It Works

### Database Layer

#### 1. Timestamp Tracking
When a task status changes to `pending_review`:
```sql
-- Trigger automatically sets pending_review_since to NOW()
NEW.pending_review_since = NOW();
```

When a task status changes from `pending_review` to anything else:
```sql
-- Trigger automatically clears pending_review_since
NEW.pending_review_since = NULL;
```

#### 2. Auto-Approval Function
```sql
CREATE OR REPLACE FUNCTION auto_approve_expired_reviews()
RETURNS INTEGER AS $$
BEGIN
  UPDATE tasks
  SET 
    status = 'completed',
    reviewed_at = NOW(),
    review_notes = 'Auto-approved after 3 days'
  WHERE 
    status = 'pending_review'
    AND pending_review_since IS NOT NULL
    AND pending_review_since <= NOW() - INTERVAL '3 days';
    
  RETURN ROW_COUNT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3. Monitoring View
```sql
CREATE OR REPLACE VIEW tasks_pending_review_with_countdown AS
SELECT 
  t.id,
  t.title,
  t.pending_review_since,
  EXTRACT(EPOCH FROM (t.pending_review_since + INTERVAL '3 days' - NOW())) AS seconds_until_auto_approval,
  CASE 
    WHEN t.pending_review_since + INTERVAL '3 days' <= NOW() THEN 'EXPIRED'
    ELSE 'PENDING'
  END AS review_status
FROM tasks t
WHERE t.status = 'pending_review';
```

### Frontend Layer

#### 1. ReviewCountdown Component
**File:** `components/tasks/ReviewCountdown.tsx`

**Features:**
- Real-time countdown calculation
- Color-coded urgency indicators
- Compact and full display modes
- Auto-refresh every minute

**Usage:**
```tsx
<ReviewCountdown 
  pendingReviewSince={task.pending_review_since}
  compact={false}
/>
```

#### 2. Auto-Approval Trigger
**File:** `utils/autoApprovalHelper.ts`

**Functions:**
- `triggerAutoApproval()` - Calls PostgreSQL function to auto-approve expired reviews
- `shouldAutoApprove()` - Client-side check if task should be auto-approved
- `getTimeUntilAutoApproval()` - Calculate seconds until auto-approval
- `formatTimeRemaining()` - Format time for display

**Trigger Points:**
- App initialization (when task list loads)
- Pull-to-refresh
- Manual refresh

---

## Installation & Setup

### Step 1: Run SQL Migration

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor:**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Execute Migration:**
   - Open `FIX_EFFORT_SCORE_ERROR.sql`
   - Copy ALL contents (now 478 lines)
   - Paste into Supabase SQL Editor
   - Click "RUN"

4. **Verify Success:**
   - Should see: "Success. No rows returned"
   - Check that `pending_review_since` column exists:
     ```sql
     SELECT column_name FROM information_schema.columns 
     WHERE table_name = 'tasks' AND column_name = 'pending_review_since';
     ```

### Step 2: Test the System

1. **Create a test task in pending_review:**
   ```sql
   UPDATE tasks 
   SET status = 'pending_review', pending_review_since = NOW() - INTERVAL '3 days 1 hour'
   WHERE id = 'your-task-id';
   ```

2. **Manually trigger auto-approval:**
   ```sql
   SELECT auto_approve_expired_reviews();
   ```

3. **Verify task was auto-approved:**
   ```sql
   SELECT id, title, status, review_notes 
   FROM tasks 
   WHERE id = 'your-task-id';
   ```

### Step 3: Reload the App

1. Press `r` in Expo terminal to reload
2. Go to Tasks tab
3. Pull to refresh
4. Check that countdown appears for pending review tasks

---

## Optional: Scheduled Auto-Approval

### Using pg_cron (Supabase Pro/Enterprise)

If you have access to `pg_cron` extension:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule auto-approval to run every hour
SELECT cron.schedule(
  'auto-approve-expired-reviews',
  '0 * * * *',  -- Every hour at minute 0
  $$SELECT auto_approve_expired_reviews();$$
);

-- Check scheduled jobs
SELECT * FROM cron.job;

-- Remove schedule if needed
SELECT cron.unschedule('auto-approve-expired-reviews');
```

### Using Supabase Edge Functions

Alternatively, create a Supabase Edge Function that runs on a schedule:

```typescript
// supabase/functions/auto-approve-reviews/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data, error } = await supabase.rpc('auto_approve_expired_reviews')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ approved_count: data }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

Then schedule it using GitHub Actions, Vercel Cron, or similar.

---

## Testing Checklist

- [ ] SQL migration runs successfully
- [ ] `pending_review_since` column exists in tasks table
- [ ] Trigger sets timestamp when task enters pending_review
- [ ] Trigger clears timestamp when task leaves pending_review
- [ ] Auto-approval function works manually
- [ ] Countdown appears in task list for pending review tasks
- [ ] Countdown shows correct time remaining
- [ ] Countdown colors change based on urgency
- [ ] Pull-to-refresh triggers auto-approval
- [ ] Expired tasks show "Auto-approving..." message
- [ ] Tasks auto-approve after 3 days

---

## Monitoring & Maintenance

### Check Pending Reviews
```sql
SELECT * FROM tasks_pending_review_with_countdown;
```

### Manually Trigger Auto-Approval
```sql
SELECT auto_approve_expired_reviews();
```

### Check Auto-Approved Tasks
```sql
SELECT id, title, status, review_notes, reviewed_at
FROM tasks
WHERE review_notes = 'Auto-approved after 3 days'
ORDER BY reviewed_at DESC
LIMIT 10;
```

### Adjust Auto-Approval Duration
To change from 3 days to a different duration, update the function:

```sql
CREATE OR REPLACE FUNCTION auto_approve_expired_reviews()
RETURNS INTEGER AS $$
BEGIN
  UPDATE tasks
  SET status = 'completed', reviewed_at = NOW(), review_notes = 'Auto-approved after 7 days'
  WHERE status = 'pending_review'
    AND pending_review_since IS NOT NULL
    AND pending_review_since <= NOW() - INTERVAL '7 days';  -- Changed to 7 days
  RETURN ROW_COUNT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Also update the constant in `ReviewCountdown.tsx`:
```typescript
const REVIEW_DURATION_DAYS = 7  // Changed from 3 to 7
```

---

## Files Modified/Created

| File | Type | Purpose |
|------|------|---------|
| `FIX_EFFORT_SCORE_ERROR.sql` | Modified | Added auto-approval system |
| `components/tasks/ReviewCountdown.tsx` | Created | Countdown timer component |
| `utils/autoApprovalHelper.ts` | Created | Helper functions for auto-approval |
| `app/(app)/tasks/index.tsx` | Modified | Display countdown, trigger auto-approval |
| `AUTO_APPROVAL_SYSTEM.md` | Created | This documentation |

---

## Troubleshooting

### Countdown Not Showing
- Check that task has `status = 'pending_review'`
- Check that `pending_review_since` is not null
- Verify SQL migration ran successfully
- Check console for errors

### Auto-Approval Not Working
- Manually run: `SELECT auto_approve_expired_reviews();`
- Check if function exists: `SELECT * FROM pg_proc WHERE proname = 'auto_approve_expired_reviews';`
- Verify trigger is active: `SELECT * FROM pg_trigger WHERE tgname LIKE '%pending_review%';`

### Timestamp Not Setting
- Check triggers are enabled
- Manually test: `UPDATE tasks SET status = 'pending_review' WHERE id = 'test-id';`
- Verify: `SELECT pending_review_since FROM tasks WHERE id = 'test-id';`

---

**System is ready! Auto-approval will work automatically after running the SQL migration.** 🚀

