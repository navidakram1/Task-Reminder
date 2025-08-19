-- 🔧 HOUSEHOLD MEMBERS FOREIGN KEY RELATIONSHIP FIX
-- This script fixes the foreign key relationship error between household_members and users

-- Step 1: Check current household_members table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'household_members' 
ORDER BY ordinal_position;

-- Step 2: Check current foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'household_members';

-- Step 3: Drop existing foreign key constraints if they exist
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find and drop any existing foreign key constraints on user_id
    FOR constraint_name IN 
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'household_members'
            AND kcu.column_name = 'user_id'
    LOOP
        EXECUTE 'ALTER TABLE household_members DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Step 4: Ensure household_members table has correct structure
-- If the table doesn't exist, create it
CREATE TABLE IF NOT EXISTS household_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'captain', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Add correct foreign key constraints
-- Reference profiles table (which references auth.users)
ALTER TABLE household_members 
ADD CONSTRAINT fk_household_members_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Reference households table
ALTER TABLE household_members 
ADD CONSTRAINT fk_household_members_household_id 
FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;

-- Step 6: Create unique constraint to prevent duplicate memberships
ALTER TABLE household_members 
ADD CONSTRAINT unique_household_user 
UNIQUE (household_id, user_id);

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_role ON household_members(role);

-- Step 8: Enable RLS on household_members
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
-- Users can view household members in their own households
CREATE POLICY "Users can view household members" ON household_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM household_members hm 
            WHERE hm.household_id = household_members.household_id 
            AND hm.user_id = auth.uid()
        )
    );

-- Users can insert themselves into households (via invite)
CREATE POLICY "Users can join households" ON household_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can manage household members
CREATE POLICY "Admins can manage members" ON household_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM household_members hm 
            WHERE hm.household_id = household_members.household_id 
            AND hm.user_id = auth.uid() 
            AND hm.role = 'admin'
        )
    );

-- Users can leave households (delete their own membership)
CREATE POLICY "Users can leave households" ON household_members
    FOR DELETE USING (user_id = auth.uid());

-- Step 10: Create helper functions for household member management

-- Function to get household members with profile information
CREATE OR REPLACE FUNCTION get_household_members(household_uuid UUID)
RETURNS TABLE (
    id UUID,
    household_id UUID,
    user_id UUID,
    role TEXT,
    joined_at TIMESTAMP WITH TIME ZONE,
    name TEXT,
    email TEXT,
    photo_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hm.id,
        hm.household_id,
        hm.user_id,
        hm.role,
        hm.joined_at,
        COALESCE(p.name, p.full_name, '') as name,
        COALESCE(p.email, '') as email,
        COALESCE(p.photo_url, p.avatar_url, '') as photo_url
    FROM household_members hm
    LEFT JOIN profiles p ON p.id = hm.user_id
    WHERE hm.household_id = household_uuid
    ORDER BY 
        CASE hm.role 
            WHEN 'admin' THEN 1 
            WHEN 'captain' THEN 2 
            WHEN 'member' THEN 3 
        END,
        hm.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add user to household
CREATE OR REPLACE FUNCTION add_user_to_household(
    household_uuid UUID,
    user_uuid UUID,
    user_role TEXT DEFAULT 'member'
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO household_members (household_id, user_id, role)
    VALUES (household_uuid, user_uuid, user_role)
    ON CONFLICT (household_id, user_id) DO NOTHING;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove user from household
CREATE OR REPLACE FUNCTION remove_user_from_household(
    household_uuid UUID,
    user_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM household_members 
    WHERE household_id = household_uuid AND user_id = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user role in household
CREATE OR REPLACE FUNCTION update_household_member_role(
    household_uuid UUID,
    user_uuid UUID,
    new_role TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE household_members 
    SET role = new_role, updated_at = NOW()
    WHERE household_id = household_uuid AND user_id = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Grant necessary permissions
GRANT ALL ON household_members TO authenticated;
GRANT EXECUTE ON FUNCTION get_household_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_to_household(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_user_from_household(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_household_member_role(UUID, UUID, TEXT) TO authenticated;

-- Step 12: Fix any existing data inconsistencies
-- Remove any household_members records that don't have corresponding profiles
DELETE FROM household_members 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Step 13: Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'Household members table fix completed!';
    RAISE NOTICE 'Total household members: %', (SELECT COUNT(*) FROM household_members);
    RAISE NOTICE 'Foreign key constraints: %', (
        SELECT COUNT(*) 
        FROM information_schema.table_constraints 
        WHERE table_name = 'household_members' AND constraint_type = 'FOREIGN KEY'
    );
END $$;

-- Step 14: Test the relationship
-- This query should now work without errors
SELECT 
    hm.id,
    hm.role,
    p.name,
    p.email,
    h.name as household_name
FROM household_members hm
LEFT JOIN profiles p ON p.id = hm.user_id
LEFT JOIN households h ON h.id = hm.household_id
LIMIT 5;
