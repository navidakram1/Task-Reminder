-- Household Proposals and Voting System
-- Run this in your Supabase SQL Editor

-- Create household_proposals table
CREATE TABLE IF NOT EXISTS household_proposals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rule_change', 'member_removal', 'household_setting', 'other')),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'passed', 'rejected')),
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  total_members INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create proposal_votes table
CREATE TABLE IF NOT EXISTS proposal_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposal_id UUID REFERENCES household_proposals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('for', 'against')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(proposal_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_household_proposals_household_id ON household_proposals(household_id);
CREATE INDEX IF NOT EXISTS idx_household_proposals_status ON household_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_proposal_id ON proposal_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_user_id ON proposal_votes(user_id);

-- Enable RLS
ALTER TABLE household_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for household_proposals
CREATE POLICY "Users can view proposals in their household" ON household_proposals 
FOR SELECT 
USING (
  household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create proposals in their household" ON household_proposals 
FOR INSERT 
WITH CHECK (
  created_by = auth.uid() AND
  household_id IN (
    SELECT household_id FROM household_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own proposals" ON household_proposals 
FOR UPDATE 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- RLS policies for proposal_votes
CREATE POLICY "Users can view votes on proposals in their household" ON proposal_votes 
FOR SELECT 
USING (
  proposal_id IN (
    SELECT id FROM household_proposals 
    WHERE household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can vote on proposals in their household" ON proposal_votes 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  proposal_id IN (
    SELECT id FROM household_proposals 
    WHERE household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own votes" ON proposal_votes 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Function to create a household proposal
CREATE OR REPLACE FUNCTION create_household_proposal(
  p_household_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_type TEXT
)
RETURNS UUID AS $$
DECLARE
  proposal_id UUID;
  member_count INTEGER;
BEGIN
  -- Check if user is a member of the household
  IF NOT EXISTS (
    SELECT 1 FROM household_members 
    WHERE household_id = p_household_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You are not a member of this household';
  END IF;

  -- Get total member count
  SELECT COUNT(*) INTO member_count
  FROM household_members
  WHERE household_id = p_household_id;

  -- Create the proposal
  INSERT INTO household_proposals (household_id, title, description, type, created_by, total_members)
  VALUES (p_household_id, p_title, p_description, p_type, auth.uid(), member_count)
  RETURNING id INTO proposal_id;

  -- Log activity
  INSERT INTO household_activity (household_id, user_id, activity_type, description, metadata)
  VALUES (
    p_household_id,
    auth.uid(),
    'proposal_created',
    'Created proposal: ' || p_title,
    jsonb_build_object('proposal_id', proposal_id, 'type', p_type)
  );

  RETURN proposal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to vote on a proposal
CREATE OR REPLACE FUNCTION vote_on_proposal(
  p_proposal_id UUID,
  p_vote TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  proposal_record RECORD;
  existing_vote TEXT;
BEGIN
  -- Get proposal details
  SELECT * INTO proposal_record
  FROM household_proposals
  WHERE id = p_proposal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal not found';
  END IF;

  -- Check if proposal is still active
  IF proposal_record.status != 'active' THEN
    RAISE EXCEPTION 'This proposal is no longer active';
  END IF;

  -- Check if proposal has expired
  IF proposal_record.expires_at < NOW() THEN
    RAISE EXCEPTION 'This proposal has expired';
  END IF;

  -- Check if user is a member of the household
  IF NOT EXISTS (
    SELECT 1 FROM household_members 
    WHERE household_id = proposal_record.household_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You are not a member of this household';
  END IF;

  -- Check if user has already voted
  SELECT vote INTO existing_vote
  FROM proposal_votes
  WHERE proposal_id = p_proposal_id AND user_id = auth.uid();

  IF existing_vote IS NOT NULL THEN
    -- Update existing vote
    UPDATE proposal_votes
    SET vote = p_vote, created_at = NOW()
    WHERE proposal_id = p_proposal_id AND user_id = auth.uid();
  ELSE
    -- Insert new vote
    INSERT INTO proposal_votes (proposal_id, user_id, vote)
    VALUES (p_proposal_id, auth.uid(), p_vote);
  END IF;

  -- Update vote counts
  UPDATE household_proposals
  SET 
    votes_for = (
      SELECT COUNT(*) FROM proposal_votes 
      WHERE proposal_id = p_proposal_id AND vote = 'for'
    ),
    votes_against = (
      SELECT COUNT(*) FROM proposal_votes 
      WHERE proposal_id = p_proposal_id AND vote = 'against'
    ),
    updated_at = NOW()
  WHERE id = p_proposal_id;

  -- Check if proposal should be resolved
  PERFORM resolve_proposal_if_needed(p_proposal_id);

  -- Log activity
  INSERT INTO household_activity (household_id, user_id, activity_type, description, metadata)
  VALUES (
    proposal_record.household_id,
    auth.uid(),
    'proposal_voted',
    'Voted ' || p_vote || ' on proposal: ' || proposal_record.title,
    jsonb_build_object('proposal_id', p_proposal_id, 'vote', p_vote)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resolve proposal if needed
CREATE OR REPLACE FUNCTION resolve_proposal_if_needed(p_proposal_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  proposal_record RECORD;
  majority_threshold INTEGER;
BEGIN
  -- Get proposal details
  SELECT * INTO proposal_record
  FROM household_proposals
  WHERE id = p_proposal_id;

  IF NOT FOUND OR proposal_record.status != 'active' THEN
    RETURN FALSE;
  END IF;

  -- Calculate majority threshold (more than 50%)
  majority_threshold := (proposal_record.total_members / 2) + 1;

  -- Check if proposal passes
  IF proposal_record.votes_for >= majority_threshold THEN
    UPDATE household_proposals
    SET status = 'passed', updated_at = NOW()
    WHERE id = p_proposal_id;

    -- Log activity
    INSERT INTO household_activity (household_id, user_id, activity_type, description, metadata)
    VALUES (
      proposal_record.household_id,
      proposal_record.created_by,
      'proposal_passed',
      'Proposal passed: ' || proposal_record.title,
      jsonb_build_object('proposal_id', p_proposal_id)
    );

    RETURN TRUE;
  END IF;

  -- Check if proposal fails
  IF proposal_record.votes_against >= majority_threshold THEN
    UPDATE household_proposals
    SET status = 'rejected', updated_at = NOW()
    WHERE id = p_proposal_id;

    -- Log activity
    INSERT INTO household_activity (household_id, user_id, activity_type, description, metadata)
    VALUES (
      proposal_record.household_id,
      proposal_record.created_by,
      'proposal_rejected',
      'Proposal rejected: ' || proposal_record.title,
      jsonb_build_object('proposal_id', p_proposal_id)
    );

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old proposals
CREATE OR REPLACE FUNCTION expire_old_proposals()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE household_proposals
  SET status = 'rejected', updated_at = NOW()
  WHERE status = 'active' AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically expire proposals
CREATE OR REPLACE FUNCTION trigger_expire_proposals()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM expire_old_proposals();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to expire proposals (if pg_cron is available)
-- SELECT cron.schedule('expire-proposals', '0 * * * *', 'SELECT expire_old_proposals();');
