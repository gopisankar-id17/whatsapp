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
