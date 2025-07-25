-- Household Proposals & Voting System Setup
-- Run this SQL in your Supabase SQL Editor

-- Create household_proposals table if it doesn't exist
CREATE TABLE IF NOT EXISTS household_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'rule_change', 'member_removal', 'household_setting')),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'passed', 'rejected', 'expired')),
    votes_for INTEGER DEFAULT 0,
    votes_against INTEGER DEFAULT 0,
    total_members INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create proposal_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS proposal_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id UUID NOT NULL REFERENCES household_proposals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vote TEXT NOT NULL CHECK (vote IN ('for', 'against')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(proposal_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_household_proposals_household_id ON household_proposals(household_id);
CREATE INDEX IF NOT EXISTS idx_household_proposals_status ON household_proposals(status);
CREATE INDEX IF NOT EXISTS idx_household_proposals_created_at ON household_proposals(created_at);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_proposal_id ON proposal_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_user_id ON proposal_votes(user_id);

-- Enable Row Level Security
ALTER TABLE household_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for household_proposals
CREATE POLICY "Users can view proposals in their household" ON household_proposals
    FOR SELECT USING (
        household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create proposals in their household" ON household_proposals
    FOR INSERT WITH CHECK (
        household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid()
        ) AND created_by = auth.uid()
    );

CREATE POLICY "Users can update their own proposals" ON household_proposals
    FOR UPDATE USING (created_by = auth.uid());

-- RLS Policies for proposal_votes
CREATE POLICY "Users can view votes on proposals in their household" ON proposal_votes
    FOR SELECT USING (
        proposal_id IN (
            SELECT id FROM household_proposals 
            WHERE household_id IN (
                SELECT household_id FROM household_members 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can vote on proposals in their household" ON proposal_votes
    FOR INSERT WITH CHECK (
        proposal_id IN (
            SELECT id FROM household_proposals 
            WHERE household_id IN (
                SELECT household_id FROM household_members 
                WHERE user_id = auth.uid()
            )
        ) AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own votes" ON proposal_votes
    FOR UPDATE USING (user_id = auth.uid());

-- Function to update proposal vote counts
CREATE OR REPLACE FUNCTION update_proposal_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE household_proposals 
    SET 
        votes_for = (
            SELECT COUNT(*) FROM proposal_votes 
            WHERE proposal_id = COALESCE(NEW.proposal_id, OLD.proposal_id) 
            AND vote = 'for'
        ),
        votes_against = (
            SELECT COUNT(*) FROM proposal_votes 
            WHERE proposal_id = COALESCE(NEW.proposal_id, OLD.proposal_id) 
            AND vote = 'against'
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.proposal_id, OLD.proposal_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update vote counts
DROP TRIGGER IF EXISTS trigger_update_proposal_vote_counts ON proposal_votes;
CREATE TRIGGER trigger_update_proposal_vote_counts
    AFTER INSERT OR UPDATE OR DELETE ON proposal_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_proposal_vote_counts();

-- Function to update total_members count when proposal is created
CREATE OR REPLACE FUNCTION update_proposal_total_members()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_members = (
        SELECT COUNT(*) FROM household_members 
        WHERE household_id = NEW.household_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set total_members on proposal creation
DROP TRIGGER IF EXISTS trigger_update_proposal_total_members ON household_proposals;
CREATE TRIGGER trigger_update_proposal_total_members
    BEFORE INSERT ON household_proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_proposal_total_members();

-- Function to automatically update proposal status based on votes and expiration
CREATE OR REPLACE FUNCTION update_proposal_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if proposal has expired
    IF NEW.expires_at < NOW() AND NEW.status = 'active' THEN
        NEW.status = 'expired';
    -- Check if proposal has majority vote
    ELSIF NEW.status = 'active' AND NEW.total_members > 0 THEN
        IF NEW.votes_for > (NEW.total_members / 2) THEN
            NEW.status = 'passed';
        ELSIF NEW.votes_against > (NEW.total_members / 2) THEN
            NEW.status = 'rejected';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update proposal status
DROP TRIGGER IF EXISTS trigger_update_proposal_status ON household_proposals;
CREATE TRIGGER trigger_update_proposal_status
    BEFORE UPDATE ON household_proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_proposal_status();

-- Function to create a household proposal (optional, for RPC calls)
CREATE OR REPLACE FUNCTION create_household_proposal(
    p_household_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_type TEXT DEFAULT 'general',
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '3 days')
)
RETURNS UUID AS $$
DECLARE
    proposal_id UUID;
BEGIN
    INSERT INTO household_proposals (
        household_id,
        title,
        description,
        type,
        created_by,
        expires_at
    ) VALUES (
        p_household_id,
        p_title,
        p_description,
        p_type,
        auth.uid(),
        p_expires_at
    ) RETURNING id INTO proposal_id;
    
    RETURN proposal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to vote on a proposal (optional, for RPC calls)
CREATE OR REPLACE FUNCTION vote_on_proposal(
    p_proposal_id UUID,
    p_vote TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate vote
    IF p_vote NOT IN ('for', 'against') THEN
        RAISE EXCEPTION 'Invalid vote. Must be "for" or "against"';
    END IF;
    
    -- Insert or update vote
    INSERT INTO proposal_votes (proposal_id, user_id, vote)
    VALUES (p_proposal_id, auth.uid(), p_vote)
    ON CONFLICT (proposal_id, user_id)
    DO UPDATE SET vote = p_vote, updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
