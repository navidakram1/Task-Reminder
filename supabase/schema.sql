-- HomeTask Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
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

-- Create households table
CREATE TABLE households (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create household_members table
CREATE TABLE household_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  recurrence TEXT CHECK (recurrence IN ('daily', 'weekly', 'monthly')),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'awaiting_approval')) DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_approvals table
CREATE TABLE task_approvals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  proof_photo_url TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bills table
CREATE TABLE bills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  category TEXT,
  date DATE NOT NULL,
  paid_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bill_splits table
CREATE TABLE bill_splits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  status TEXT CHECK (status IN ('owed', 'paid')) DEFAULT 'owed',
  settled_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(bill_id, user_id)
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT CHECK (plan IN ('free', 'monthly', 'lifetime')) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_household_members_household_id ON household_members(household_id);
CREATE INDEX idx_household_members_user_id ON household_members(user_id);
CREATE INDEX idx_tasks_household_id ON tasks(household_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_task_approvals_task_id ON task_approvals(task_id);
CREATE INDEX idx_task_approvals_status ON task_approvals(status);
CREATE INDEX idx_bills_household_id ON bills(household_id);
CREATE INDEX idx_bills_paid_by ON bills(paid_by);
CREATE INDEX idx_bill_splits_bill_id ON bill_splits(bill_id);
CREATE INDEX idx_bill_splits_user_id ON bill_splits(user_id);
CREATE INDEX idx_bill_splits_status ON bill_splits(status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Households policies
CREATE POLICY "Household members can view household" ON households FOR SELECT 
  USING (id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "Household admins can update household" ON households FOR UPDATE 
  USING (admin_id = auth.uid());
CREATE POLICY "Users can create households" ON households FOR INSERT WITH CHECK (admin_id = auth.uid());

-- Household members policies
CREATE POLICY "Household members can view members" ON household_members FOR SELECT 
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can join households" ON household_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can leave households" ON household_members FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage members" ON household_members FOR ALL 
  USING (household_id IN (SELECT id FROM households WHERE admin_id = auth.uid()));

-- Tasks policies
CREATE POLICY "Household members can view tasks" ON tasks FOR SELECT 
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "Household members can create tasks" ON tasks FOR INSERT 
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Task creators and assignees can update tasks" ON tasks FOR UPDATE 
  USING (created_by = auth.uid() OR assignee_id = auth.uid());
CREATE POLICY "Task creators can delete tasks" ON tasks FOR DELETE USING (created_by = auth.uid());

-- Task approvals policies
CREATE POLICY "Household members can view approvals" ON task_approvals FOR SELECT 
  USING (task_id IN (SELECT id FROM tasks WHERE household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())));
CREATE POLICY "Task assignees can create approvals" ON task_approvals FOR INSERT 
  WITH CHECK (submitted_by = auth.uid() AND task_id IN (SELECT id FROM tasks WHERE assignee_id = auth.uid()));
CREATE POLICY "Household members can update approvals" ON task_approvals FOR UPDATE 
  USING (task_id IN (SELECT id FROM tasks WHERE household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())));

-- Bills policies
CREATE POLICY "Household members can view bills" ON bills FOR SELECT 
  USING (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()));
CREATE POLICY "Household members can create bills" ON bills FOR INSERT 
  WITH CHECK (household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid()) AND paid_by = auth.uid());
CREATE POLICY "Bill creators can update bills" ON bills FOR UPDATE USING (paid_by = auth.uid());
CREATE POLICY "Bill creators can delete bills" ON bills FOR DELETE USING (paid_by = auth.uid());

-- Bill splits policies
CREATE POLICY "Household members can view splits" ON bill_splits FOR SELECT 
  USING (bill_id IN (SELECT id FROM bills WHERE household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())));
CREATE POLICY "Bill creators can manage splits" ON bill_splits FOR ALL 
  USING (bill_id IN (SELECT id FROM bills WHERE paid_by = auth.uid()));
CREATE POLICY "Users can update own splits" ON bill_splits FOR UPDATE USING (user_id = auth.uid());

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own subscription" ON subscriptions FOR ALL USING (user_id = auth.uid());

-- Functions and Triggers

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
