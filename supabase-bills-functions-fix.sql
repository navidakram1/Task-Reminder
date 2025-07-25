-- SAFE Function Updates for Bills System
-- This fixes the function signature conflicts
-- Run this SQL in your Supabase SQL Editor

-- Safely drop and recreate functions with new signatures

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_debt_summary(UUID, UUID);
DROP FUNCTION IF EXISTS get_household_debt_summary(UUID);
DROP FUNCTION IF EXISTS optimize_settlements(UUID);
DROP FUNCTION IF EXISTS get_spending_analytics(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS schedule_payment_reminders();
DROP FUNCTION IF EXISTS suggest_expense_category(TEXT, TEXT, DECIMAL);
DROP FUNCTION IF EXISTS mark_split_as_paid(UUID);

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
    ORDER BY array_length(keywords, 1) DESC
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
