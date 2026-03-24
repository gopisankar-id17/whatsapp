const { supabaseAdmin } = require('../../config/supabase');
const { processLinkPreviews } = require('../../utils/linkPreview');

const messageHandler = (socket, io) => {
  // ── Join conversation room ─────────────────────────────────
  socket.on('join_room', (conversationId) => {
    console.log(`[Socket Server] User ${socket.profile?.name} (${socket.id}) joining room: ${conversationId}`);
    socket.join(conversationId);
  });

  socket.on('leave_room', (conversationId) => {
    console.log(`[Socket Server] User ${socket.profile?.name} (${socket.id}) leaving room: ${conversationId}`);
    socket.leave(conversationId);
  });

  // ── Send message ───────────────────────────────────────────
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, text, mediaUrl, mediaType, repliedToMessageId } = data;
      if (!conversationId || (!text && !mediaUrl)) return;

      // Save to Supabase
      const { data: message, error } = await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: socket.user.id,
          text: text || '',
          media_url: mediaUrl || '',
          media_type: mediaType || '',
          replied_to_message_id: repliedToMessageId || null,
          status: 'sent',
        })
        .select(`*, profiles(id, name, avatar_url), replied_to_message:replied_to_message_id(id, text, sender_id, media_type, profiles(name))`)
        .single();

      if (error) {
        return socket.emit('error', { message: 'Failed to save message' });
      }

      // Update conversation timestamp
      await supabaseAdmin
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Broadcast to room
      io.to(conversationId).emit('receive_message', message);

      // Process link previews asynchronously (non-blocking)
      if (text) {
        processLinkPreviews(text, message.id).then((previews) => {
          if (previews.length > 0) {
            // Emit updated message with link previews
            io.to(conversationId).emit('link_previews_added', {
              messageId: message.id,
              linkPreviews: previews,
            });
          }
        }).catch((err) => console.error('Error processing link previews:', err));
      }

      // Notify all participants' personal rooms (for sidebar update)
      const { data: participants } = await supabaseAdmin
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId);

      participants?.forEach(({ user_id }) => {
        io.to(user_id).emit('conversation_updated', {
          conversationId,
          lastMessage: message,
          lastMessageAt: new Date().toISOString(),
        });
      });
    } catch (err) {
      console.error('send_message error:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // ── Typing indicator ───────────────────────────────────────
  socket.on('user_typing', ({ conversationId, isTyping }) => {
    socket.to(conversationId).emit('user_typing', {
      conversationId,
      userId: socket.user.id,
      name: socket.profile?.name,
      isTyping,
    });
  });

  // ── Mark messages as read ──────────────────────────────────
  socket.on('message_read', async ({ conversationId, messageIds }) => {
    try {
      const reads = messageIds.map(id => ({
        message_id: id,
        user_id: socket.user.id,
      }));

      await supabaseAdmin
        .from('message_reads')
        .upsert(reads, { onConflict: 'message_id,user_id' });

      await supabaseAdmin
        .from('messages')
        .update({ status: 'read' })
        .in('id', messageIds);

      socket.to(conversationId).emit('messages_read', {
        conversationId,
        messageIds,
        readBy: socket.user.id,
      });
    } catch (err) {
      console.error('message_read error:', err);
    }
  });

  // ── Profile updated broadcast ─────────────────────────────
  socket.on('profile_updated', ({ name, avatar_url }) => {
    io.emit('profile_updated', {
      userId: socket.user.id,
      name,
      avatar_url,
    });
  });
};

module.exports = messageHandler;