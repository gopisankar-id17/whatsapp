-- Schema Updates for Phase 2: Replies and Reactions

-- Feature 2: Reply to Message
-- Add column to messages table to track replies
ALTER TABLE messages ADD COLUMN replied_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Optional: Denormalized field for quick access
ALTER TABLE messages ADD COLUMN replied_to_message_text TEXT;

-- Index for faster queries
CREATE INDEX ON messages(replied_to_message_id);

-----

-- Feature 4: Message Reactions
-- Create table for storing message reactions
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction)
);

-- Indexes for efficient queries
CREATE INDEX ON message_reactions(message_id);
CREATE INDEX ON message_reactions(user_id);

-- Grant appropriate permissions
GRANT ALL ON message_reactions TO authenticated;
GRANT ALL ON message_reactions TO service_role;

-----

-- Feature: Unread Message Tracking
-- Create table for tracking when users last read messages in each conversation
CREATE TABLE conversation_read_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Indexes for efficient queries
CREATE INDEX ON conversation_read_status(conversation_id);
CREATE INDEX ON conversation_read_status(user_id);
CREATE INDEX ON conversation_read_status(last_read_message_id);

-- Grant appropriate permissions
GRANT ALL ON conversation_read_status TO authenticated;
GRANT ALL ON conversation_read_status TO service_role;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_read_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_conversation_read_status_updated_at
  BEFORE UPDATE ON conversation_read_status
  FOR EACH ROW EXECUTE FUNCTION update_conversation_read_status_updated_at();
