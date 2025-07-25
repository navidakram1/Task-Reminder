-- Bills & Bill Splitting System Setup
-- Run this SQL in your Supabase SQL Editor

-- Create bills table if it doesn't exist
CREATE TABLE IF NOT EXISTS bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    category TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    paid_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bill_splits table if it doesn't exist
CREATE TABLE IF NOT EXISTS bill_splits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'owed' CHECK (status IN ('owed', 'paid')),
    settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(bill_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bills_household_id ON bills(household_id);
CREATE INDEX IF NOT EXISTS idx_bills_paid_by ON bills(paid_by);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date);
CREATE INDEX IF NOT EXISTS idx_bill_splits_bill_id ON bill_splits(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_splits_user_id ON bill_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_splits_status ON bill_splits(status);

-- Enable Row Level Security
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_splits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bills
CREATE POLICY "Users can view bills in their household" ON bills
    FOR SELECT USING (
        household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create bills in their household" ON bills
    FOR INSERT WITH CHECK (
        household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid()
        ) AND paid_by = auth.uid()
    );

CREATE POLICY "Users can update bills they created" ON bills
    FOR UPDATE USING (paid_by = auth.uid());

CREATE POLICY "Users can delete bills they created" ON bills
    FOR DELETE USING (paid_by = auth.uid());

-- RLS Policies for bill_splits
CREATE POLICY "Users can view splits for bills in their household" ON bill_splits
    FOR SELECT USING (
        bill_id IN (
            SELECT id FROM bills 
            WHERE household_id IN (
                SELECT household_id FROM household_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create splits for bills in their household" ON bill_splits
    FOR INSERT WITH CHECK (
        bill_id IN (
            SELECT id FROM bills 
            WHERE household_id IN (
                SELECT household_id FROM household_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own splits or splits for bills they created" ON bill_splits
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        bill_id IN (
            SELECT id FROM bills WHERE paid_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete splits for bills they created" ON bill_splits
    FOR DELETE USING (
        bill_id IN (
            SELECT id FROM bills WHERE paid_by = auth.uid()
        )
    );

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

-- Function to calculate total owed by a user in a household
CREATE OR REPLACE FUNCTION get_user_debt_summary(p_user_id UUID, p_household_id UUID)
RETURNS TABLE(
    total_owed DECIMAL,
    total_owing DECIMAL,
    net_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH user_debts AS (
        SELECT 
            COALESCE(SUM(CASE WHEN bs.status = 'owed' THEN bs.amount ELSE 0 END), 0) as owed,
            0 as owing
        FROM bill_splits bs
        JOIN bills b ON bs.bill_id = b.id
        WHERE bs.user_id = p_user_id 
        AND b.household_id = p_household_id
        
        UNION ALL
        
        SELECT 
            0 as owed,
            COALESCE(SUM(CASE WHEN bs.status = 'owed' THEN bs.amount ELSE 0 END), 0) as owing
        FROM bill_splits bs
        JOIN bills b ON bs.bill_id = b.id
        WHERE b.paid_by = p_user_id 
        AND b.household_id = p_household_id
        AND bs.user_id != p_user_id
    )
    SELECT 
        SUM(owed) as total_owed,
        SUM(owing) as total_owing,
        SUM(owing) - SUM(owed) as net_amount
    FROM user_debts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get household debt summary
CREATE OR REPLACE FUNCTION get_household_debt_summary(p_household_id UUID)
RETURNS TABLE(
    user_id UUID,
    user_name TEXT,
    total_owed DECIMAL,
    total_owing DECIMAL,
    net_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hm.user_id,
        p.name as user_name,
        COALESCE(debt.total_owed, 0) as total_owed,
        COALESCE(debt.total_owing, 0) as total_owing,
        COALESCE(debt.net_amount, 0) as net_amount
    FROM household_members hm
    JOIN profiles p ON hm.user_id = p.id
    LEFT JOIN LATERAL get_user_debt_summary(hm.user_id, p_household_id) debt ON true
    WHERE hm.household_id = p_household_id
    ORDER BY debt.net_amount DESC NULLS LAST;
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

-- Apply update triggers
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

-- Function to validate bill splits total matches bill amount
CREATE OR REPLACE FUNCTION validate_bill_splits()
RETURNS TRIGGER AS $$
DECLARE
    bill_amount DECIMAL;
    splits_total DECIMAL;
BEGIN
    -- Get the bill amount
    SELECT amount INTO bill_amount
    FROM bills
    WHERE id = NEW.bill_id;
    
    -- Calculate total of all splits for this bill
    SELECT COALESCE(SUM(amount), 0) INTO splits_total
    FROM bill_splits
    WHERE bill_id = NEW.bill_id;
    
    -- Add the new split amount if this is an insert
    IF TG_OP = 'INSERT' THEN
        splits_total := splits_total + NEW.amount;
    ELSIF TG_OP = 'UPDATE' THEN
        splits_total := splits_total - OLD.amount + NEW.amount;
    END IF;
    
    -- Allow some small rounding differences (1 cent)
    IF ABS(splits_total - bill_amount) > 0.01 THEN
        RAISE EXCEPTION 'Bill splits total (%) does not match bill amount (%)', splits_total, bill_amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger (optional - can be disabled if you want to allow partial splits)
-- DROP TRIGGER IF EXISTS validate_bill_splits_trigger ON bill_splits;
-- CREATE TRIGGER validate_bill_splits_trigger
--     BEFORE INSERT OR UPDATE ON bill_splits
--     FOR EACH ROW
--     EXECUTE FUNCTION validate_bill_splits();
