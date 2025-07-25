-- Fixed Bills & Bill Splitting System Setup
-- This version works with your existing database schema
-- Run this SQL in your Supabase SQL Editor

-- Create expense categories table for smart categorization
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT,
    keywords TEXT[], -- For AI/ML categorization
    parent_category_id UUID REFERENCES expense_categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO expense_categories (name, icon, color, keywords) VALUES
('Food & Dining', '🍽️', '#FF6B6B', ARRAY['restaurant', 'food', 'dining', 'grocery', 'cafe', 'lunch', 'dinner']),
('Transportation', '🚗', '#4ECDC4', ARRAY['gas', 'uber', 'taxi', 'parking', 'metro', 'bus', 'train']),
('Utilities', '⚡', '#45B7D1', ARRAY['electric', 'water', 'gas', 'internet', 'phone', 'cable']),
('Housing', '🏠', '#96CEB4', ARRAY['rent', 'mortgage', 'maintenance', 'repairs']),
('Entertainment', '🎬', '#FFEAA7', ARRAY['movie', 'concert', 'game', 'streaming', 'netflix']),
('Shopping', '🛍️', '#DDA0DD', ARRAY['amazon', 'target', 'walmart', 'clothes', 'shopping']),
('Healthcare', '🏥', '#FFB6C1', ARRAY['doctor', 'pharmacy', 'hospital', 'medicine', 'dental']),
('Travel', '✈️', '#87CEEB', ARRAY['hotel', 'flight', 'airbnb', 'vacation', 'trip'])
ON CONFLICT (name) DO NOTHING;

-- Add new columns to existing bills table (safe to run multiple times)
ALTER TABLE bills ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS receipt_urls TEXT[];
ALTER TABLE bills ADD COLUMN IF NOT EXISTS split_method TEXT DEFAULT 'equal';
ALTER TABLE bills ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS tip_percentage DECIMAL(5,2);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS recurring_frequency TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS next_due_date DATE;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS merchant_name TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_settled BOOLEAN DEFAULT false;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE;

-- Add constraints (will fail silently if they already exist)
DO $$ 
BEGIN
    ALTER TABLE bills ADD CONSTRAINT bills_currency_check 
        CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE bills ADD CONSTRAINT bills_split_method_check 
        CHECK (split_method IN ('equal', 'percentage', 'custom', 'by_item', 'by_shares'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
    ALTER TABLE bills ADD CONSTRAINT bills_recurring_frequency_check 
        CHECK (recurring_frequency IN ('weekly', 'monthly', 'yearly'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add new columns to existing bill_splits table
ALTER TABLE bill_splits ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE bill_splits ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 1;
ALTER TABLE bill_splits ADD COLUMN IF NOT EXISTS percentage DECIMAL(5,2);
ALTER TABLE bill_splits ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bill_splits ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE bill_splits ADD COLUMN IF NOT EXISTS payment_confirmation_url TEXT;
ALTER TABLE bill_splits ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;
ALTER TABLE bill_splits ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE;

-- Update status column constraint
DO $$ 
BEGIN
    ALTER TABLE bill_splits DROP CONSTRAINT IF EXISTS bill_splits_status_check;
    ALTER TABLE bill_splits ADD CONSTRAINT bill_splits_status_check 
        CHECK (status IN ('owed', 'partially_paid', 'paid', 'disputed'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Add payment method constraint
DO $$ 
BEGIN
    ALTER TABLE bill_splits ADD CONSTRAINT bill_splits_payment_method_check 
        CHECK (payment_method IN ('cash', 'venmo', 'paypal', 'zelle', 'bank_transfer', 'other'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Bill items table for itemized splitting
CREATE TABLE IF NOT EXISTS bill_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    quantity INTEGER DEFAULT 1,
    participants UUID[] NOT NULL, -- Array of user IDs who share this item
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment confirmations table
CREATE TABLE IF NOT EXISTS payment_confirmations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    split_id UUID NOT NULL REFERENCES bill_splits(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    confirmation_photo_url TEXT,
    notes TEXT,
    confirmed_by UUID NOT NULL REFERENCES profiles(id),
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table for reminders and alerts
CREATE TABLE IF NOT EXISTS bill_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    split_id UUID REFERENCES bill_splits(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('new_bill', 'payment_reminder', 'payment_received', 'bill_settled', 'spending_summary')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget tracking table
CREATE TABLE IF NOT EXISTS household_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL, -- Using category name instead of ID
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    alert_threshold DECIMAL(5,2) DEFAULT 80, -- Alert when 80% of budget is reached
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bills_household_id ON bills(household_id);
CREATE INDEX IF NOT EXISTS idx_bills_paid_by ON bills(paid_by);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date);
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category);
CREATE INDEX IF NOT EXISTS idx_bill_splits_bill_id ON bill_splits(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_splits_user_id ON bill_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_splits_status ON bill_splits(status);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_notifications_user_id ON bill_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_name ON expense_categories(name);

-- Enable Row Level Security on new tables
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_categories (public read)
CREATE POLICY "Anyone can view expense categories" ON expense_categories
    FOR SELECT USING (true);

-- RLS Policies for bill_items
CREATE POLICY "Users can view bill items in their household" ON bill_items
    FOR SELECT USING (
        bill_id IN (
            SELECT id FROM bills 
            WHERE household_id IN (
                SELECT household_id FROM household_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create bill items for bills in their household" ON bill_items
    FOR INSERT WITH CHECK (
        bill_id IN (
            SELECT id FROM bills 
            WHERE household_id IN (
                SELECT household_id FROM household_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- RLS Policies for payment_confirmations
CREATE POLICY "Users can view payment confirmations in their household" ON payment_confirmations
    FOR SELECT USING (
        split_id IN (
            SELECT bs.id FROM bill_splits bs
            JOIN bills b ON bs.bill_id = b.id
            WHERE b.household_id IN (
                SELECT household_id FROM household_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create payment confirmations" ON payment_confirmations
    FOR INSERT WITH CHECK (confirmed_by = auth.uid());

-- RLS Policies for bill_notifications
CREATE POLICY "Users can view their own notifications" ON bill_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON bill_notifications
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for household_budgets
CREATE POLICY "Users can view budgets in their household" ON household_budgets
    FOR SELECT USING (
        household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage budgets in their household" ON household_budgets
    FOR ALL USING (
        household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid()
        )
    );

-- Function for smart expense categorization (returns category name)
CREATE OR REPLACE FUNCTION suggest_expense_category(p_title TEXT, p_merchant TEXT DEFAULT NULL, p_amount DECIMAL DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    category_name TEXT;
    title_lower TEXT := LOWER(p_title);
    merchant_lower TEXT := LOWER(COALESCE(p_merchant, ''));
BEGIN
    -- Try to match keywords in title or merchant name
    SELECT name INTO category_name
    FROM expense_categories
    WHERE is_active = true
    AND (
        EXISTS (
            SELECT 1 FROM unnest(keywords) keyword
            WHERE title_lower LIKE '%' || keyword || '%'
            OR merchant_lower LIKE '%' || keyword || '%'
        )
    )
    ORDER BY array_length(keywords, 1) DESC -- Prefer categories with more specific keywords
    LIMIT 1;

    -- If no match found, return default category
    IF category_name IS NULL THEN
        category_name := 'Shopping';
    END IF;

    RETURN category_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function to calculate user debt summary with partial payments
CREATE OR REPLACE FUNCTION get_user_debt_summary(p_user_id UUID, p_household_id UUID)
RETURNS TABLE(
    total_owed DECIMAL,
    total_owing DECIMAL,
    net_amount DECIMAL,
    partially_paid DECIMAL,
    overdue_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH user_debts AS (
        SELECT
            COALESCE(SUM(CASE WHEN bs.status IN ('owed', 'partially_paid') THEN bs.amount - COALESCE(bs.paid_amount, 0) ELSE 0 END), 0) as owed,
            COALESCE(SUM(COALESCE(bs.paid_amount, 0)), 0) as partial_paid,
            COALESCE(SUM(CASE WHEN bs.status IN ('owed', 'partially_paid') AND b.due_date < CURRENT_DATE THEN bs.amount - COALESCE(bs.paid_amount, 0) ELSE 0 END), 0) as overdue,
            0 as owing
        FROM bill_splits bs
        JOIN bills b ON bs.bill_id = b.id
        WHERE bs.user_id = p_user_id
        AND b.household_id = p_household_id

        UNION ALL

        SELECT
            0 as owed,
            0 as partial_paid,
            0 as overdue,
            COALESCE(SUM(CASE WHEN bs.status IN ('owed', 'partially_paid') THEN bs.amount - COALESCE(bs.paid_amount, 0) ELSE 0 END), 0) as owing
        FROM bill_splits bs
        JOIN bills b ON bs.bill_id = b.id
        WHERE b.paid_by = p_user_id
        AND b.household_id = p_household_id
        AND bs.user_id != p_user_id
    )
    SELECT
        SUM(owed) as total_owed,
        SUM(owing) as total_owing,
        SUM(owing) - SUM(owed) as net_amount,
        SUM(partial_paid) as partially_paid,
        SUM(overdue) as overdue_amount
    FROM user_debts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced function to get household debt summary
CREATE OR REPLACE FUNCTION get_household_debt_summary(p_household_id UUID)
RETURNS TABLE(
    user_id UUID,
    user_name TEXT,
    total_owed DECIMAL,
    total_owing DECIMAL,
    net_amount DECIMAL,
    partially_paid DECIMAL,
    overdue_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        hm.user_id,
        p.name as user_name,
        COALESCE(debt.total_owed, 0) as total_owed,
        COALESCE(debt.total_owing, 0) as total_owing,
        COALESCE(debt.net_amount, 0) as net_amount,
        COALESCE(debt.partially_paid, 0) as partially_paid,
        COALESCE(debt.overdue_amount, 0) as overdue_amount
    FROM household_members hm
    JOIN profiles p ON hm.user_id = p.id
    LEFT JOIN LATERAL get_user_debt_summary(hm.user_id, p_household_id) debt ON true
    WHERE hm.household_id = p_household_id
    ORDER BY debt.net_amount DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to optimize settlements (debt simplification)
CREATE OR REPLACE FUNCTION optimize_settlements(p_household_id UUID)
RETURNS TABLE(
    from_user_id UUID,
    to_user_id UUID,
    amount DECIMAL,
    currency TEXT
) AS $$
DECLARE
    user_balance RECORD;
    creditor RECORD;
    debtor RECORD;
    settlement_amount DECIMAL;
BEGIN
    -- Create temporary table with user balances
    CREATE TEMP TABLE IF NOT EXISTS user_balances AS
    SELECT
        hm.user_id,
        COALESCE(debt.net_amount, 0) as balance
    FROM household_members hm
    LEFT JOIN LATERAL get_user_debt_summary(hm.user_id, p_household_id) debt ON true
    WHERE hm.household_id = p_household_id
    AND COALESCE(debt.net_amount, 0) != 0;

    -- Optimize settlements using greedy algorithm
    FOR creditor IN
        SELECT user_id, balance FROM user_balances WHERE balance > 0 ORDER BY balance DESC
    LOOP
        FOR debtor IN
            SELECT user_id, balance FROM user_balances WHERE balance < 0 ORDER BY balance ASC
        LOOP
            settlement_amount := LEAST(creditor.balance, ABS(debtor.balance));

            IF settlement_amount > 0.01 THEN -- Ignore very small amounts
                RETURN QUERY SELECT debtor.user_id, creditor.user_id, settlement_amount, 'USD'::TEXT;

                -- Update balances
                UPDATE user_balances SET balance = balance - settlement_amount WHERE user_id = creditor.user_id;
                UPDATE user_balances SET balance = balance + settlement_amount WHERE user_id = debtor.user_id;

                -- Refresh creditor balance
                SELECT balance INTO creditor.balance FROM user_balances WHERE user_id = creditor.user_id;

                IF creditor.balance <= 0.01 THEN
                    EXIT; -- This creditor is settled
                END IF;
            END IF;
        END LOOP;
    END LOOP;

    DROP TABLE IF EXISTS user_balances;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate spending analytics (works with existing category column)
CREATE OR REPLACE FUNCTION get_spending_analytics(
    p_household_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 year',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    category_name TEXT,
    category_icon TEXT,
    total_amount DECIMAL,
    transaction_count INTEGER,
    avg_amount DECIMAL,
    percentage_of_total DECIMAL,
    trend_direction TEXT -- 'up', 'down', 'stable'
) AS $$
DECLARE
    total_spending DECIMAL;
BEGIN
    -- Calculate total spending for percentage calculation
    SELECT COALESCE(SUM(amount), 0) INTO total_spending
    FROM bills
    WHERE household_id = p_household_id
    AND date BETWEEN p_start_date AND p_end_date;

    RETURN QUERY
    WITH current_period AS (
        SELECT
            COALESCE(b.category, 'Uncategorized') as cat_name,
            COALESCE(ec.icon, '📋') as cat_icon,
            SUM(b.amount) as total_amt,
            COUNT(*) as trans_count,
            AVG(b.amount) as avg_amt
        FROM bills b
        LEFT JOIN expense_categories ec ON LOWER(b.category) = LOWER(ec.name)
        WHERE b.household_id = p_household_id
        AND b.date BETWEEN p_start_date AND p_end_date
        GROUP BY COALESCE(b.category, 'Uncategorized'), COALESCE(ec.icon, '📋')
    ),
    previous_period AS (
        SELECT
            COALESCE(b.category, 'Uncategorized') as cat_name,
            SUM(b.amount) as prev_total
        FROM bills b
        WHERE b.household_id = p_household_id
        AND b.date BETWEEN (p_start_date - (p_end_date - p_start_date)) AND p_start_date
        GROUP BY COALESCE(b.category, 'Uncategorized')
    )
    SELECT
        cp.cat_name,
        cp.cat_icon,
        cp.total_amt,
        cp.trans_count::INTEGER,
        cp.avg_amt,
        CASE
            WHEN total_spending > 0 THEN ROUND((cp.total_amt / total_spending * 100), 2)
            ELSE 0
        END as percentage_of_total,
        CASE
            WHEN pp.prev_total IS NULL THEN 'new'::TEXT
            WHEN cp.total_amt > pp.prev_total * 1.1 THEN 'up'::TEXT
            WHEN cp.total_amt < pp.prev_total * 0.9 THEN 'down'::TEXT
            ELSE 'stable'::TEXT
        END as trend_direction
    FROM current_period cp
    LEFT JOIN previous_period pp ON cp.cat_name = pp.cat_name
    ORDER BY cp.total_amt DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to schedule payment reminders
CREATE OR REPLACE FUNCTION schedule_payment_reminders()
RETURNS INTEGER AS $$
DECLARE
    reminder_count INTEGER := 0;
    split_record RECORD;
    days_overdue INTEGER;
    reminder_frequency INTEGER;
BEGIN
    FOR split_record IN
        SELECT bs.*, b.title, b.due_date, p.name as user_name
        FROM bill_splits bs
        JOIN bills b ON bs.bill_id = b.id
        JOIN profiles p ON bs.user_id = p.id
        WHERE bs.status IN ('owed', 'partially_paid')
        AND b.due_date IS NOT NULL
        AND b.due_date <= CURRENT_DATE
    LOOP
        days_overdue := CURRENT_DATE - split_record.due_date;

        -- Escalating reminder frequency: daily for first week, then weekly
        reminder_frequency := CASE
            WHEN days_overdue <= 7 THEN 1  -- Daily
            ELSE 7  -- Weekly
        END;

        -- Check if reminder should be sent
        IF split_record.last_reminder_sent IS NULL
           OR split_record.last_reminder_sent <= CURRENT_DATE - INTERVAL '1 day' * reminder_frequency THEN

            INSERT INTO bill_notifications (
                user_id,
                split_id,
                type,
                title,
                message,
                scheduled_for
            ) VALUES (
                split_record.user_id,
                split_record.id,
                'payment_reminder',
                'Payment Reminder: ' || split_record.title,
                'You have an overdue payment of $' || split_record.amount || ' for ' || split_record.title,
                NOW()
            );

            -- Update reminder tracking
            UPDATE bill_splits
            SET
                reminder_count = COALESCE(reminder_count, 0) + 1,
                last_reminder_sent = CURRENT_DATE
            WHERE id = split_record.id;

            reminder_count := reminder_count + 1;
        END IF;
    END LOOP;

    RETURN reminder_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update bill split status when settled
CREATE OR REPLACE FUNCTION mark_split_as_paid(split_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE bill_splits
    SET
        status = 'paid',
        settled_at = NOW(),
        updated_at = NOW()
    WHERE id = split_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to existing tables
DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;
CREATE TRIGGER update_bills_updated_at
    BEFORE UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bill_splits_updated_at ON bill_splits;
CREATE TRIGGER update_bill_splits_updated_at
    BEFORE UPDATE ON bill_splits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
