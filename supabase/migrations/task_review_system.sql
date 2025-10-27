-- Task Review System
-- Allows household members to request and provide reviews for completed tasks
-- Run this in your Supabase SQL Editor

-- Create task_reviews table
CREATE TABLE IF NOT EXISTS task_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, reviewer_id)
);

-- Create task_review_requests table
CREATE TABLE IF NOT EXISTS task_review_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_from UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(task_id, requested_from)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_reviews_task_id ON task_reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_task_reviews_household_id ON task_reviews(household_id);
CREATE INDEX IF NOT EXISTS idx_task_reviews_reviewer_id ON task_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_task_reviews_status ON task_reviews(status);
CREATE INDEX IF NOT EXISTS idx_task_review_requests_task_id ON task_review_requests(task_id);
CREATE INDEX IF NOT EXISTS idx_task_review_requests_household_id ON task_review_requests(household_id);
CREATE INDEX IF NOT EXISTS idx_task_review_requests_requested_from ON task_review_requests(requested_from);
CREATE INDEX IF NOT EXISTS idx_task_review_requests_status ON task_review_requests(status);

-- Enable RLS
ALTER TABLE task_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_review_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_reviews
CREATE POLICY "Household members can view task reviews" ON task_reviews FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reviews for tasks in their household" ON task_reviews FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
    AND reviewer_id = auth.uid()
  );

CREATE POLICY "Reviewers can update their own reviews" ON task_reviews FOR UPDATE
  USING (reviewer_id = auth.uid())
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Reviewers can delete their own reviews" ON task_reviews FOR DELETE
  USING (reviewer_id = auth.uid());

-- RLS Policies for task_review_requests
CREATE POLICY "Household members can view review requests" ON task_review_requests FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can request reviews from household members" ON task_review_requests FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
    AND requested_by = auth.uid()
  );

CREATE POLICY "Requested users can update review requests" ON task_review_requests FOR UPDATE
  USING (requested_from = auth.uid())
  WITH CHECK (requested_from = auth.uid());

CREATE POLICY "Requested users can delete review requests" ON task_review_requests FOR DELETE
  USING (requested_from = auth.uid());

-- View for task reviews with user info
CREATE OR REPLACE VIEW task_reviews_with_users AS
SELECT 
  tr.*,
  rp.name as reviewer_name,
  rp.email as reviewer_email,
  rp.photo_url as reviewer_photo,
  t.title as task_title,
  t.description as task_description,
  t.assignee_id
FROM task_reviews tr
LEFT JOIN profiles rp ON tr.reviewer_id = rp.id
LEFT JOIN tasks t ON tr.task_id = t.id;

-- View for task review requests with user info
CREATE OR REPLACE VIEW task_review_requests_with_users AS
SELECT 
  trr.*,
  rp.name as requested_by_name,
  rp.email as requested_by_email,
  rp.photo_url as requested_by_photo,
  fp.name as requested_from_name,
  fp.email as requested_from_email,
  fp.photo_url as requested_from_photo,
  t.title as task_title,
  t.description as task_description
FROM task_review_requests trr
LEFT JOIN profiles rp ON trr.requested_by = rp.id
LEFT JOIN profiles fp ON trr.requested_from = fp.id
LEFT JOIN tasks t ON trr.task_id = t.id;

