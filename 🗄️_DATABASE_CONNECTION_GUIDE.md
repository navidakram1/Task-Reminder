# 🗄️ Database Connection Guide

## Overview

This guide shows how to properly connect each page to the database with correct queries, RLS policies, and error handling.

---

## 📊 Database Tables Reference

### 1. Profiles Table
```sql
SELECT * FROM profiles WHERE id = auth.uid()
```
**Fields**: id, name, email, phone, photo_url, notification_preferences, created_at, updated_at

### 2. Households Table
```sql
SELECT * FROM households WHERE id = (
  SELECT household_id FROM household_members WHERE user_id = auth.uid() LIMIT 1
)
```
**Fields**: id, name, admin_id, invite_code, created_at, updated_at

### 3. Household Members Table
```sql
SELECT * FROM household_members WHERE household_id = $1
```
**Fields**: id, household_id, user_id, role, joined_at

### 4. Tasks Table
```sql
SELECT * FROM tasks WHERE household_id = $1 ORDER BY due_date ASC
```
**Fields**: id, household_id, title, description, due_date, priority, recurrence, assignee_id, status, created_by, created_at, updated_at, emoji

### 5. Task Approvals Table
```sql
SELECT * FROM task_approvals WHERE task_id = $1
```
**Fields**: id, task_id, submitted_by, proof_photo_url, status, reviewed_by, reviewed_at, comments, created_at

### 6. Task Reviews Table (NEW)
```sql
SELECT * FROM task_reviews WHERE task_id = $1
```
**Fields**: id, task_id, household_id, reviewer_id, rating, comment, status, created_at, updated_at

### 7. Task Review Requests Table (NEW)
```sql
SELECT * FROM task_review_requests WHERE task_id = $1
```
**Fields**: id, task_id, household_id, requested_by, requested_from, status, message, created_at, responded_at

### 8. Bills Table
```sql
SELECT * FROM bills WHERE household_id = $1 ORDER BY date DESC
```
**Fields**: id, household_id, title, amount, category, date, paid_by, receipt_url, created_at, updated_at

### 9. Bill Splits Table
```sql
SELECT * FROM bill_splits WHERE bill_id = $1
```
**Fields**: id, bill_id, user_id, amount, status, settled_at

### 10. Shopping Lists Table
```sql
SELECT * FROM shopping_lists WHERE household_id = $1 ORDER BY created_at DESC
```
**Fields**: id, household_id, name, description, created_by, created_at, updated_at

### 11. Shopping Items Table
```sql
SELECT * FROM shopping_items WHERE list_id = $1 ORDER BY created_at ASC
```
**Fields**: id, list_id, name, quantity, category, completed, created_at, updated_at

### 12. Proposals Table
```sql
SELECT * FROM proposals WHERE household_id = $1 ORDER BY created_at DESC
```
**Fields**: id, household_id, title, description, created_by, status, created_at, updated_at

### 13. Proposal Votes Table
```sql
SELECT * FROM proposal_votes WHERE proposal_id = $1
```
**Fields**: id, proposal_id, user_id, vote, created_at

### 14. Subscriptions Table
```sql
SELECT * FROM subscriptions WHERE user_id = auth.uid()
```
**Fields**: id, user_id, plan, started_at, expires_at, payment_id, created_at, updated_at

### 15. Support Tickets Table
```sql
SELECT * FROM support_tickets WHERE user_id = auth.uid() ORDER BY created_at DESC
```
**Fields**: id, user_id, subject, description, status, priority, created_at, updated_at

---

## 🔗 Common Query Patterns

### Get Current Household
```typescript
const { data: householdData } = await supabase.rpc('get_default_household')
const householdId = householdData[0].household_id
```

### Get Household Members
```typescript
const { data: members } = await supabase
  .from('household_members')
  .select('*, profiles(*)')
  .eq('household_id', householdId)
```

### Get User Tasks
```typescript
const { data: tasks } = await supabase
  .from('tasks')
  .select('*')
  .eq('household_id', householdId)
  .order('due_date', { ascending: true })
```

### Get Task Reviews
```typescript
const { data: reviews } = await supabase
  .from('task_reviews_with_users')
  .select('*')
  .eq('task_id', taskId)
```

### Get Pending Review Requests
```typescript
const { data: requests } = await supabase
  .from('task_review_requests_with_users')
  .select('*')
  .eq('requested_from', userId)
  .eq('status', 'pending')
```

### Get Household Bills
```typescript
const { data: bills } = await supabase
  .from('bills')
  .select('*, bill_splits(*)')
  .eq('household_id', householdId)
  .order('date', { ascending: false })
```

### Get Shopping Lists
```typescript
const { data: lists } = await supabase
  .from('shopping_lists')
  .select('*')
  .eq('household_id', householdId)
  .order('created_at', { ascending: false })
```

---

## ✅ RLS Policy Checklist

### For Each Table, Verify:
- [ ] SELECT policy allows household members to view
- [ ] INSERT policy allows authorized users to create
- [ ] UPDATE policy allows authorized users to modify
- [ ] DELETE policy allows authorized users to remove
- [ ] No cross-household data leakage
- [ ] Admin-only operations protected

### Example RLS Policy
```sql
CREATE POLICY "Users can view household data"
  ON tasks FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid()
    )
  );
```

---

## 🔄 Data Flow Patterns

### Task Creation Flow
1. User creates task in `tasks/create.tsx`
2. Task inserted into `tasks` table
3. Task assigned to household member
4. Task appears in `tasks/index.tsx`
5. Assignee sees task in dashboard

### Task Review Flow
1. User marks task complete
2. Task status changes to `awaiting_approval`
3. Approval request created in `task_approvals`
4. Reviewer sees in `approvals/index.tsx`
5. Reviewer approves/rejects
6. Task status updated to `completed` or `pending`
7. Review request can be created in `task_review_requests`
8. Reviewer rates task in `task_reviews`

### Bill Splitting Flow
1. User creates bill in `bills/create.tsx`
2. Bill inserted into `bills` table
3. Splits created in `bill_splits` table
4. Bill appears in `bills/index.tsx`
5. Users see their share in dashboard
6. Settlement tracked in `bill_splits.status`

### Shopping Flow
1. User creates list in `shopping/create.tsx`
2. List inserted into `shopping_lists` table
3. Items added to `shopping_items` table
4. List appears in `shopping/index.tsx`
5. Items can be checked off
6. Progress tracked in dashboard

---

## 🛡️ Security Best Practices

### 1. Always Use RLS
```typescript
// ✅ GOOD - RLS enforced
const { data } = await supabase
  .from('tasks')
  .select('*')
  .eq('household_id', householdId)

// ❌ BAD - No RLS check
const { data } = await supabase
  .from('tasks')
  .select('*')
```

### 2. Verify User Permissions
```typescript
// ✅ GOOD - Check user is in household
const { data: member } = await supabase
  .from('household_members')
  .select('*')
  .eq('household_id', householdId)
  .eq('user_id', userId)
  .single()

if (!member) throw new Error('Not authorized')
```

### 3. Use Transactions for Related Updates
```typescript
// ✅ GOOD - Atomic operation
const { data: approval } = await supabase
  .from('task_approvals')
  .update({ status: 'approved' })
  .eq('id', approvalId)

const { data: task } = await supabase
  .from('tasks')
  .update({ status: 'completed' })
  .eq('id', taskId)
```

### 4. Validate Input Data
```typescript
// ✅ GOOD - Validate before insert
if (!taskName.trim()) throw new Error('Task name required')
if (dueDate && new Date(dueDate) < new Date()) {
  throw new Error('Due date must be in future')
}
```

---

## 📱 Page-to-Database Mapping

| Page | Primary Table | Related Tables | Key Operations |
|------|---------------|----------------|-----------------|
| Dashboard | tasks, bills | shopping_lists, proposals | SELECT, COUNT |
| Tasks | tasks | task_approvals, task_reviews | SELECT, INSERT, UPDATE |
| Task Details | tasks | task_approvals, task_reviews | SELECT, UPDATE |
| Approvals | task_approvals | tasks, profiles | SELECT, UPDATE |
| Reviews | task_reviews | tasks, profiles | SELECT, INSERT, UPDATE |
| Bills | bills | bill_splits, profiles | SELECT, INSERT, UPDATE |
| Shopping | shopping_lists | shopping_items | SELECT, INSERT, UPDATE, DELETE |
| Proposals | proposals | proposal_votes, profiles | SELECT, INSERT, UPDATE |
| Household | household_members | profiles | SELECT, INSERT, DELETE |
| Settings | profiles | households | SELECT, UPDATE |
| Subscription | subscriptions | profiles | SELECT, INSERT, UPDATE |

---

## 🚀 Deployment Steps

1. **Create Migration File**
   ```bash
   supabase migration new task_review_system
   ```

2. **Add SQL to Migration**
   - Copy content from `supabase/migrations/task_review_system.sql`

3. **Push to Supabase**
   ```bash
   supabase db push
   ```

4. **Verify Tables Created**
   ```bash
   supabase db list
   ```

5. **Test RLS Policies**
   - Create test user
   - Verify can only see own household data
   - Verify cannot access other households

6. **Update TypeScript Types**
   - Add TaskReview interface
   - Add TaskReviewRequest interface
   - Update API types

---

## 🔍 Debugging Tips

### Check RLS Policies
```sql
SELECT * FROM pg_policies WHERE tablename = 'tasks'
```

### View Table Structure
```sql
\d tasks
```

### Test Query
```sql
SELECT * FROM tasks WHERE household_id = 'your-household-id'
```

### Check Indexes
```sql
SELECT * FROM pg_indexes WHERE tablename = 'tasks'
```

---

**Last Updated**: 2025-10-27  
**Database Version**: PostgreSQL 14+  
**Supabase Version**: Latest  

