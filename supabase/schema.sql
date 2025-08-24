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
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  recurrence TEXT CHECK (recurrence IN ('daily', 'weekly', 'monthly')),
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'awaiting_approval')) DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  emoji TEXT
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

-- Social Features Tables
CREATE TABLE user_referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    total_referrals INTEGER DEFAULT 0,
    successful_referrals INTEGER DEFAULT 0,
    pending_rewards DECIMAL(10,2) DEFAULT 0,
    total_rewards_earned DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE referral_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    reward_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL,
    category VARCHAR(50) NOT NULL,
    requirement INTEGER NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    reward_type VARCHAR(50) NOT NULL,
    reward_value INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL,
    shareable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, milestone_id)
);

-- Customer Support Tables
CREATE TABLE bug_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    steps_to_reproduce TEXT,
    expected_behavior TEXT,
    actual_behavior TEXT,
    device_info TEXT,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(50) DEFAULT 'general',
    screenshots TEXT[], -- Array of file paths
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE feature_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    use_case TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category VARCHAR(50) DEFAULT 'general',
    votes INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'planned', 'in_development', 'completed', 'rejected')),
    estimated_effort VARCHAR(20),
    target_release VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE support_tickets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE support_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_type VARCHAR(20) DEFAULT 'customer' CHECK (sender_type IN ('customer', 'support')),
    message TEXT NOT NULL,
    attachments TEXT[], -- Array of file paths
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Analytics Tables
CREATE TABLE analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_type VARCHAR(20) DEFAULT 'free',
    acquisition_channel VARCHAR(50),
    first_login TIMESTAMP WITH TIME ZONE,
    last_active TIMESTAMP WITH TIME ZONE,
    total_sessions INTEGER DEFAULT 0,
    total_session_duration INTEGER DEFAULT 0, -- in seconds
    tasks_created INTEGER DEFAULT 0,
    bills_created INTEGER DEFAULT 0,
    households_joined INTEGER DEFAULT 0,
    referrals_made INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE subscription_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    subscription_type VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE retention_cohorts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cohort_month DATE NOT NULL,
    users_count INTEGER NOT NULL,
    week_1_retention DECIMAL(5,2),
    week_2_retention DECIMAL(5,2),
    week_4_retention DECIMAL(5,2),
    week_8_retention DECIMAL(5,2),
    week_12_retention DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cohort_month)
);

-- Enable RLS on new tables
ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_cohorts ENABLE ROW LEVEL SECURITY;

-- Storage Buckets Setup
INSERT INTO storage.buckets (id, name, public) VALUES
  ('receipts', 'receipts', true),
  ('task-proofs', 'task-proofs', true),
  ('bug-reports', 'bug-reports', false),
  ('profile-photos', 'profile-photos', true);

-- Add missing columns to existing tables (for database updates)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS emoji TEXT;

-- Storage Policies
CREATE POLICY "Users can upload receipts" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view receipts" ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

CREATE POLICY "Users can upload task proofs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'task-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view task proofs" ON storage.objects FOR SELECT
  USING (bucket_id = 'task-proofs');

CREATE POLICY "Users can upload bug report screenshots" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bug-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own bug report screenshots" ON storage.objects FOR SELECT
  USING (bucket_id = 'bug-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload profile photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view profile photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');
