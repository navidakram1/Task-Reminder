-- Household Multi-Group Enhancement
-- Add support for multiple households and group types
-- Run this SQL in your Supabase SQL Editor

-- Add type column to households table
DO $$ 
BEGIN
    ALTER TABLE households ADD COLUMN type TEXT DEFAULT 'household';
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Add constraint for household type
DO $$ 
BEGIN
    ALTER TABLE households ADD CONSTRAINT households_type_check 
        CHECK (type IN ('household', 'group'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add is_active column to household_members for better multi-household support
DO $$ 
BEGIN
    ALTER TABLE household_members ADD COLUMN is_active BOOLEAN DEFAULT true;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Add joined_at timestamp to household_members
DO $$ 
BEGIN
    ALTER TABLE household_members ADD COLUMN joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Create function to get user's active household
CREATE OR REPLACE FUNCTION get_user_active_household(p_user_id UUID)
RETURNS TABLE(
    household_id UUID,
    household_name TEXT,
    household_type TEXT,
    user_role TEXT,
    invite_code TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id as household_id,
        h.name as household_name,
        COALESCE(h.type, 'household') as household_type,
        hm.role as user_role,
        h.invite_code
    FROM household_members hm
    JOIN households h ON hm.household_id = h.id
    WHERE hm.user_id = p_user_id
    AND hm.is_active = true
    ORDER BY hm.joined_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all user households
CREATE OR REPLACE FUNCTION get_user_households(p_user_id UUID)
RETURNS TABLE(
    household_id UUID,
    household_name TEXT,
    household_type TEXT,
    user_role TEXT,
    invite_code TEXT,
    member_count INTEGER,
    is_active BOOLEAN,
    joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id as household_id,
        h.name as household_name,
        COALESCE(h.type, 'household') as household_type,
        hm.role as user_role,
        h.invite_code,
        (
            SELECT COUNT(*)::INTEGER 
            FROM household_members hm2 
            WHERE hm2.household_id = h.id
        ) as member_count,
        hm.is_active,
        hm.joined_at
    FROM household_members hm
    JOIN households h ON hm.household_id = h.id
    WHERE hm.user_id = p_user_id
    ORDER BY hm.is_active DESC, hm.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to switch active household
CREATE OR REPLACE FUNCTION switch_active_household(p_user_id UUID, p_household_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Deactivate all households for user
    UPDATE household_members 
    SET is_active = false 
    WHERE user_id = p_user_id;
    
    -- Activate the selected household
    UPDATE household_members 
    SET is_active = true 
    WHERE user_id = p_user_id 
    AND household_id = p_household_id;
    
    -- Check if update was successful
    IF FOUND THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing households to have default type
UPDATE households 
SET type = 'household' 
WHERE type IS NULL;

-- Set first household as active for users who don't have any active household
DO $$
DECLARE
    user_record RECORD;
    first_household_id UUID;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM household_members 
        WHERE user_id NOT IN (
            SELECT user_id 
            FROM household_members 
            WHERE is_active = true
        )
    LOOP
        -- Get the first household for this user
        SELECT household_id INTO first_household_id
        FROM household_members 
        WHERE user_id = user_record.user_id 
        ORDER BY joined_at ASC 
        LIMIT 1;
        
        -- Set it as active
        IF first_household_id IS NOT NULL THEN
            UPDATE household_members 
            SET is_active = true 
            WHERE user_id = user_record.user_id 
            AND household_id = first_household_id;
        END IF;
    END LOOP;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_household_members_user_active ON household_members(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_household_members_joined_at ON household_members(joined_at);
CREATE INDEX IF NOT EXISTS idx_households_type ON households(type);

-- Add RLS policy for household type access
DO $$ 
BEGIN
    CREATE POLICY "Users can view household types" ON households
        FOR SELECT USING (
            id IN (
                SELECT household_id FROM household_members 
                WHERE user_id = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Update existing RLS policies to consider active households
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view tasks in their household" ON tasks;
    CREATE POLICY "Users can view tasks in their household" ON tasks
        FOR SELECT USING (
            household_id IN (
                SELECT household_id FROM household_members 
                WHERE user_id = auth.uid()
            )
        );
EXCEPTION
    WHEN others THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view bills in their household" ON bills;
    CREATE POLICY "Users can view bills in their household" ON bills
        FOR SELECT USING (
            household_id IN (
                SELECT household_id FROM household_members 
                WHERE user_id = auth.uid()
            )
        );
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Function to create household with proper member setup
CREATE OR REPLACE FUNCTION create_household_with_member(
    p_user_id UUID,
    p_household_name TEXT,
    p_household_type TEXT DEFAULT 'household',
    p_invite_code TEXT DEFAULT NULL
)
RETURNS TABLE(
    household_id UUID,
    household_name TEXT,
    invite_code TEXT
) AS $$
DECLARE
    new_household_id UUID;
    generated_invite_code TEXT;
BEGIN
    -- Generate invite code if not provided
    IF p_invite_code IS NULL THEN
        generated_invite_code := upper(substring(md5(random()::text) from 1 for 6));
    ELSE
        generated_invite_code := p_invite_code;
    END IF;
    
    -- Create household
    INSERT INTO households (name, admin_id, invite_code, type)
    VALUES (p_household_name, p_user_id, generated_invite_code, p_household_type)
    RETURNING id INTO new_household_id;
    
    -- Deactivate all existing household memberships for user
    UPDATE household_members 
    SET is_active = false 
    WHERE user_id = p_user_id;
    
    -- Add user as admin member
    INSERT INTO household_members (household_id, user_id, role, is_active, joined_at)
    VALUES (new_household_id, p_user_id, 'admin', true, NOW());
    
    -- Return household info
    RETURN QUERY
    SELECT 
        new_household_id,
        p_household_name,
        generated_invite_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join household with proper member setup
CREATE OR REPLACE FUNCTION join_household_with_member(
    p_user_id UUID,
    p_invite_code TEXT
)
RETURNS TABLE(
    household_id UUID,
    household_name TEXT,
    household_type TEXT
) AS $$
DECLARE
    target_household_id UUID;
    target_household_name TEXT;
    target_household_type TEXT;
BEGIN
    -- Find household by invite code
    SELECT id, name, COALESCE(type, 'household')
    INTO target_household_id, target_household_name, target_household_type
    FROM households 
    WHERE invite_code = p_invite_code;
    
    IF target_household_id IS NULL THEN
        RAISE EXCEPTION 'Invalid invite code';
    END IF;
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM household_members 
        WHERE household_id = target_household_id 
        AND user_id = p_user_id
    ) THEN
        -- Just activate this household
        UPDATE household_members 
        SET is_active = false 
        WHERE user_id = p_user_id;
        
        UPDATE household_members 
        SET is_active = true 
        WHERE household_id = target_household_id 
        AND user_id = p_user_id;
    ELSE
        -- Deactivate all existing household memberships for user
        UPDATE household_members 
        SET is_active = false 
        WHERE user_id = p_user_id;
        
        -- Add user as member
        INSERT INTO household_members (household_id, user_id, role, is_active, joined_at)
        VALUES (target_household_id, p_user_id, 'member', true, NOW());
    END IF;
    
    -- Return household info
    RETURN QUERY
    SELECT 
        target_household_id,
        target_household_name,
        target_household_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
