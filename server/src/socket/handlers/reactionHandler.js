const { query } = require('../../config/database');

const reactionHandler = (socket, io) => {
  // ── Add reaction to a message ───────────────────────────────
  socket.on('add_reaction', async (data) => {
    try {
      const { messageId, conversationId, reaction } = data;
      if (!messageId || !conversationId || !reaction) return;

      // Upsert reaction using PostgreSQL
      await query(`
        INSERT INTO message_reactions (message_id, user_id, reaction, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (message_id, user_id, reaction)
        DO UPDATE SET created_at = NOW()
      `, [messageId, socket.user.id, reaction]);

      // Broadcast to conversation room
      io.to(conversationId).emit('reaction_added', {
        messageId,
        userId: socket.user.id,
        userName: socket.profile?.name,
        reaction,
      });
    } catch (err) {
      console.error('add_reaction error:', err);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });

  // ── Remove reaction from a message ──────────────────────────
  socket.on('remove_reaction', async (data) => {
    try {
      const { messageId, conversationId, reaction } = data;
      if (!messageId || !conversationId || !reaction) return;

      // Delete reaction from PostgreSQL
      await query(`
        DELETE FROM message_reactions
        WHERE message_id = $1 AND user_id = $2 AND reaction = $3
      `, [messageId, socket.user.id, reaction]);

      // Broadcast to conversation room
      io.to(conversationId).emit('reaction_removed', {
        messageId,
        userId: socket.user.id,
        reaction,
      });
    } catch (err) {
      console.error('remove_reaction error:', err);
      socket.emit('error', { message: 'Failed to remove reaction' });
    }
  });
};

module.exports = reactionHandler;