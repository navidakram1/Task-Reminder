-- ============================================================================
-- FIX RLS POLICIES - Enable RLS and create proper policies for all tables
-- ============================================================================

-- Enable RLS on all core tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TASKS TABLE POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view tasks in their household" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their household" ON tasks;
DROP POLICY IF EXISTS "Task creators and assignees can update tasks" ON tasks;
DROP POLICY IF EXISTS "Task creators can delete tasks" ON tasks;

-- Create new policies
CREATE POLICY "Users can view tasks in their household" ON tasks
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their household" ON tasks
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Task creators and assignees can update tasks" ON tasks
  FOR UPDATE
  USING (
    created_by = auth.uid() 
    OR assignee_id = auth.uid()
    OR household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid() AND role IN ('admin', 'captain')
    )
  )
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Task creators can delete tasks" ON tasks
  FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- BILLS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view bills in their household" ON bills;
DROP POLICY IF EXISTS "Users can create bills in their household" ON bills;
DROP POLICY IF EXISTS "Bill creators can update bills" ON bills;
DROP POLICY IF EXISTS "Bill creators can delete bills" ON bills;

CREATE POLICY "Users can view bills in their household" ON bills
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bills in their household" ON bills
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
    AND paid_by = auth.uid()
  );

CREATE POLICY "Bill creators can update bills" ON bills
  FOR UPDATE
  USING (paid_by = auth.uid())
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Bill creators can delete bills" ON bills
  FOR DELETE
  USING (paid_by = auth.uid());

-- ============================================================================
-- BILL_SPLITS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view bill splits in their household" ON bill_splits;
DROP POLICY IF EXISTS "Users can create bill splits in their household" ON bill_splits;
DROP POLICY IF EXISTS "Users can update bill splits" ON bill_splits;

CREATE POLICY "Users can view bill splits in their household" ON bill_splits
  FOR SELECT
  USING (
    bill_id IN (
      SELECT id FROM bills WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create bill splits in their household" ON bill_splits
  FOR INSERT
  WITH CHECK (
    bill_id IN (
      SELECT id FROM bills WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update bill splits" ON bill_splits
  FOR UPDATE
  USING (
    bill_id IN (
      SELECT id FROM bills WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- HOUSEHOLD_MEMBERS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view household members" ON household_members;
DROP POLICY IF EXISTS "Admins can manage household members" ON household_members;

CREATE POLICY "Users can view household members" ON household_members
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage household members" ON household_members
  FOR ALL
  USING (
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- HOUSEHOLDS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their households" ON households;
DROP POLICY IF EXISTS "Admins can update their households" ON households;

CREATE POLICY "Users can view their households" ON households
  FOR SELECT
  USING (
    id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their households" ON households
  FOR UPDATE
  USING (
    id IN (
      SELECT household_id FROM household_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- TASK_APPROVALS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view task approvals in their household" ON task_approvals;
DROP POLICY IF EXISTS "Users can create task approvals" ON task_approvals;
DROP POLICY IF EXISTS "Admins can update task approvals" ON task_approvals;

CREATE POLICY "Users can view task approvals in their household" ON task_approvals
  FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create task approvals" ON task_approvals
  FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can update task approvals" ON task_approvals
  FOR UPDATE
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE household_id IN (
        SELECT household_id FROM household_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'captain')
      )
    )
  );

-- ============================================================================
-- SHOPPING_LISTS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view shopping lists in their household" ON shopping_lists;
DROP POLICY IF EXISTS "Users can create shopping lists" ON shopping_lists;

CREATE POLICY "Users can view shopping lists in their household" ON shopping_lists
  FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create shopping lists" ON shopping_lists
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- SHOPPING_ITEMS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view shopping items in their household" ON shopping_items;
DROP POLICY IF EXISTS "Users can create shopping items" ON shopping_items;

CREATE POLICY "Users can view shopping items in their household" ON shopping_items
  FOR SELECT
  USING (
    list_id IN (
      SELECT id FROM shopping_lists WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create shopping items" ON shopping_items
  FOR INSERT
  WITH CHECK (
    list_id IN (
      SELECT id FROM shopping_lists WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON subscriptions;

CREATE POLICY "Users can view their own subscription" ON subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription" ON subscriptions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'bills', 'household_members', 'households', 'profiles')
ORDER BY tablename;

