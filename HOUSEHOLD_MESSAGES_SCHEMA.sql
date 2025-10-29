-- ============================================
-- HOUSEHOLD MESSAGES SCHEMA
-- ============================================
-- This creates the complete messaging system for households
-- Similar to Flatastic with Messages, Activities, and Notes tabs

-- ============================================
-- PART 1: Create Messages Table
-- ============================================

CREATE TABLE IF NOT EXISTS household_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_type VARCHAR(50) DEFAULT 'message' CHECK (message_type IN ('message', 'activity', 'note')),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_household_messages_household_id ON household_messages(household_id);
CREATE INDEX IF NOT EXISTS idx_household_messages_user_id ON household_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_household_messages_created_at ON household_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_household_messages_type ON household_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_household_messages_pinned ON household_messages(is_pinned) WHERE is_pinned = TRUE;

-- ============================================
-- PART 2: Create Message Reactions Table
-- ============================================

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES household_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction_emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- ============================================
-- PART 3: Create Message Read Status Table
-- ============================================

CREATE TABLE IF NOT EXISTS message_read_status (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES household_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_read_status_message_id ON message_read_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_user_id ON message_read_status(user_id);

-- ============================================
-- PART 4: Create Activity Log Table
-- ============================================

CREATE TABLE IF NOT EXISTS household_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  activity_description TEXT,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_household_activities_household_id ON household_activities(household_id);
CREATE INDEX IF NOT EXISTS idx_household_activities_user_id ON household_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_household_activities_created_at ON household_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_household_activities_type ON household_activities(activity_type);

-- ============================================
-- PART 5: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE household_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_activities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 6: RLS Policies for household_messages
-- ============================================

-- Users can view messages in their households
CREATE POLICY "Users can view messages in their households" ON household_messages FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- Users can insert messages in their households
CREATE POLICY "Users can insert messages in their households" ON household_messages FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON household_messages FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON household_messages FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- PART 7: RLS Policies for message_reactions
-- ============================================

CREATE POLICY "Users can view reactions in their households" ON message_reactions FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM household_messages WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can add reactions in their households" ON message_reactions FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT id FROM household_messages WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can delete their own reactions" ON message_reactions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- PART 8: RLS Policies for message_read_status
-- ============================================

CREATE POLICY "Users can view read status in their households" ON message_read_status FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM household_messages WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can mark messages as read" ON message_read_status FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT id FROM household_messages WHERE household_id IN (
        SELECT household_id FROM household_members WHERE user_id = auth.uid()
      )
    )
    AND user_id = auth.uid()
  );

-- ============================================
-- PART 9: RLS Policies for household_activities
-- ============================================

CREATE POLICY "Users can view activities in their households" ON household_activities FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activities in their households" ON household_activities FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- ============================================
-- PART 10: Grant Permissions
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON household_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON message_reactions TO authenticated;
GRANT SELECT, INSERT ON message_read_status TO authenticated;
GRANT SELECT, INSERT ON household_activities TO authenticated;

-- ============================================
-- PART 11: Create Helpful Views
-- ============================================

-- View for messages with user info
CREATE OR REPLACE VIEW household_messages_with_users AS
SELECT
  hm.*,
  u.email as user_email,
  COALESCE(p.name, u.email) as user_name,
  p.photo_url as user_photo,
  (SELECT COUNT(*) FROM message_reactions WHERE message_id = hm.id) as reaction_count,
  (SELECT COUNT(*) FROM message_read_status WHERE message_id = hm.id) as read_count
FROM household_messages hm
LEFT JOIN auth.users u ON hm.user_id = u.id
LEFT JOIN profiles p ON hm.user_id = p.id;

-- View for unread message count per household
CREATE OR REPLACE VIEW unread_messages_count AS
SELECT
  hm.household_id,
  COUNT(DISTINCT hm.id) as unread_count
FROM household_messages hm
LEFT JOIN message_read_status mrs ON hm.id = mrs.message_id AND mrs.user_id = auth.uid()
WHERE mrs.id IS NULL
GROUP BY hm.household_id;

-- View for activities with user info
CREATE OR REPLACE VIEW household_activities_with_users AS
SELECT
  ha.*,
  u.email as user_email,
  COALESCE(p.name, u.email) as user_name,
  p.photo_url as user_photo
FROM household_activities ha
LEFT JOIN auth.users u ON ha.user_id = u.id
LEFT JOIN profiles p ON ha.user_id = p.id;

GRANT SELECT ON household_messages_with_users TO authenticated;
GRANT SELECT ON unread_messages_count TO authenticated;
GRANT SELECT ON household_activities_with_users TO authenticated;

-- ============================================
-- PART 12: Create Functions
-- ============================================

-- Function to send a message
CREATE OR REPLACE FUNCTION send_household_message(
  p_household_id UUID,
  p_content TEXT,
  p_message_type VARCHAR DEFAULT 'message'
)
RETURNS JSON AS $$
DECLARE
  v_message_id UUID;
BEGIN
  INSERT INTO household_messages (household_id, user_id, content, message_type)
  VALUES (p_household_id, auth.uid(), p_content, p_message_type)
  RETURNING id INTO v_message_id;

  RETURN json_build_object(
    'success', true,
    'message_id', v_message_id,
    'created_at', NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(p_household_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT hm.id) INTO v_count
  FROM household_messages hm
  LEFT JOIN message_read_status mrs ON hm.id = mrs.message_id AND mrs.user_id = auth.uid()
  WHERE hm.household_id = p_household_id
    AND mrs.id IS NULL;

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION send_household_message TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count TO authenticated;

-- ============================================
-- SUCCESS!
-- ============================================
-- After running this file:
-- 1. Messages table is created
-- 2. Activities table is created
-- 3. RLS policies are in place
-- 4. Views and functions are ready
-- 5. You can start using the messaging system!
-- ============================================

