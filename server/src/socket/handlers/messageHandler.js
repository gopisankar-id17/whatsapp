const { supabaseAdmin } = require('../../config/supabase');
const { processLinkPreviews } = require('../../utils/linkPreview');

const messageHandler = (socket, io) => {
  // ── Test ping ─────────────────────────────────────────────────
  socket.on('ping', (data) => {
    console.log(`[Socket Server] Ping received from ${socket.profile?.name}:`, data);
    socket.emit('pong', { message: 'Server received your ping!', timestamp: new Date().toISOString() });
  });

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
      console.log(`[Socket Server] Broadcasting message to room: ${conversationId}`);
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

      if (participants) {
        // Calculate unread count for each participant (with error handling)
        const participantUpdates = await Promise.all(
          participants.map(async ({ user_id }) => {
            if (user_id === socket.user.id) {
              // Sender has 0 unread messages
              return { user_id, unreadCount: 0 };
            }

            let unreadCount = 0;

            try {
              // Get recipient's last read status
              const { data: readStatus } = await supabaseAdmin
                .from('conversation_read_status')
                .select('last_read_message_id')
                .eq('conversation_id', conversationId)
                .eq('user_id', user_id)
                .single();

              if (readStatus?.last_read_message_id) {
                // Count messages after last read message
                const { data: lastReadMsg } = await supabaseAdmin
                  .from('messages')
                  .select('created_at')
                  .eq('id', readStatus.last_read_message_id)
                  .single();

                if (lastReadMsg) {
                  const { count } = await supabaseAdmin
                    .from('messages')
                    .select('id', { count: 'exact' })
                    .eq('conversation_id', conversationId)
                    .neq('sender_id', user_id) // Don't count own messages
                    .gt('created_at', lastReadMsg.created_at);

                  unreadCount = count || 0;
                }
              } else {
                // No read status - count all messages from others
                const { count } = await supabaseAdmin
                  .from('messages')
                  .select('id', { count: 'exact' })
                  .eq('conversation_id', conversationId)
                  .neq('sender_id', user_id);

                unreadCount = count || 0;
              }
            } catch (error) {
              console.warn('[Socket Server] Unread count calculation failed (table may not exist):', error.message);
              // Fallback: set unread count to 1 for non-senders if table doesn't exist
              unreadCount = 1;
            }

            return { user_id, unreadCount };
          })
        );

        // emit to each participant with their specific unread count
        participantUpdates.forEach(({ user_id, unreadCount }) => {
          console.log(`[Socket Server] Emitting conversation_updated to user ${user_id} with unread count: ${unreadCount}`);
          io.to(user_id).emit('conversation_updated', {
            conversationId,
            lastMessage: message,
            lastMessageAt: new Date().toISOString(),
            unreadCount,
          });
        });
      }
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