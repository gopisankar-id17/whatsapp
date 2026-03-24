const { supabaseAdmin } = require('../../config/supabase');

const reactionHandler = (socket, io) => {
  // ── Add reaction to a message ───────────────────────────────
  socket.on('add_reaction', async (data) => {
    try {
      const { messageId, conversationId, reaction } = data;
      if (!messageId || !conversationId || !reaction) return;

      const { data: result, error } = await supabaseAdmin
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: socket.user.id,
          reaction,
        }, { onConflict: 'message_id,user_id,reaction' })
        .select()
        .single();

      if (error) {
        console.error('add_reaction error:', error);
        return socket.emit('error', { message: 'Failed to add reaction' });
      }

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

      const { error } = await supabaseAdmin
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', socket.user.id)
        .eq('reaction', reaction);

      if (error) {
        console.error('remove_reaction error:', error);
        return socket.emit('error', { message: 'Failed to remove reaction' });
      }

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
