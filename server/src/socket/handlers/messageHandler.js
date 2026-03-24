const { query } = require('../../config/database');
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

      console.log(`[Socket Server] Saving message to database for conversation ${conversationId}`);

      // Save message to PostgreSQL database
      const messageResult = await query(`
        INSERT INTO messages (conversation_id, sender_id, text, media_url, media_type, replied_to_message_id, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'sent', NOW())
        RETURNING *
      `, [
        conversationId,
        socket.user.id,
        text || '',
        mediaUrl || '',
        mediaType || '',
        repliedToMessageId || null
      ]);

      if (messageResult.rows.length === 0) {
        return socket.emit('error', { message: 'Failed to save message' });
      }

      const savedMessage = messageResult.rows[0];

      // Get message with profile information and replied message info
      const messageWithProfileResult = await query(`
        SELECT m.*,
               json_build_object(
                 'id', p.id,
                 'name', p.name,
                 'avatar_url', p.avatar_url
               ) as profiles,
               CASE
                 WHEN m.replied_to_message_id IS NOT NULL THEN
                   (SELECT json_build_object(
                     'id', rm.id,
                     'text', rm.text,
                     'sender_id', rm.sender_id,
                     'media_type', rm.media_type,
                     'profiles', json_build_object('name', rp.name)
                   )
                   FROM messages rm
                   LEFT JOIN profiles rp ON rm.sender_id = rp.id
                   WHERE rm.id = m.replied_to_message_id)
                 ELSE NULL
               END as replied_to_message
        FROM messages m
        LEFT JOIN profiles p ON m.sender_id = p.id
        WHERE m.id = $1
      `, [savedMessage.id]);

      const message = messageWithProfileResult.rows[0];

      // Update conversation timestamp
      await query(`
        UPDATE conversations
        SET last_message_at = NOW()
        WHERE id = $1
      `, [conversationId]);

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

      // Get all participants for this conversation
      const participantsResult = await query(`
        SELECT user_id
        FROM conversation_participants
        WHERE conversation_id = $1
      `, [conversationId]);

      if (participantsResult.rows.length > 0) {
        // Calculate unread count for each participant
        const participantUpdates = await Promise.all(
          participantsResult.rows.map(async ({ user_id }) => {
            if (user_id === socket.user.id) {
              // Sender has 0 unread messages
              return { user_id, unreadCount: 0 };
            }

            let unreadCount = 0;

            try {
              // Get recipient's last read status
              const readStatusResult = await query(`
                SELECT last_read_message_id
                FROM conversation_read_status
                WHERE conversation_id = $1 AND user_id = $2
              `, [conversationId, user_id]);

              if (readStatusResult.rows.length > 0 && readStatusResult.rows[0].last_read_message_id) {
                // Count messages after last read message
                const lastReadMsgResult = await query(`
                  SELECT created_at
                  FROM messages
                  WHERE id = $1
                `, [readStatusResult.rows[0].last_read_message_id]);

                if (lastReadMsgResult.rows.length > 0) {
                  const unreadResult = await query(`
                    SELECT COUNT(*) as count
                    FROM messages
                    WHERE conversation_id = $1
                      AND sender_id != $2
                      AND created_at > $3
                  `, [conversationId, user_id, lastReadMsgResult.rows[0].created_at]);

                  unreadCount = parseInt(unreadResult.rows[0].count) || 0;
                }
              } else {
                // No read status - count all messages from others
                const unreadResult = await query(`
                  SELECT COUNT(*) as count
                  FROM messages
                  WHERE conversation_id = $1 AND sender_id != $2
                `, [conversationId, user_id]);

                unreadCount = parseInt(unreadResult.rows[0].count) || 0;
              }
            } catch (error) {
              console.warn('[Socket Server] Unread count calculation failed:', error.message);
              // Fallback: set unread count to 1 for non-senders if table doesn't exist
              unreadCount = 1;
            }

            return { user_id, unreadCount };
          })
        );

        // Emit to each participant with their specific unread count
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
      // Insert read receipts (using INSERT ... ON CONFLICT for upsert behavior)
      for (const messageId of messageIds) {
        await query(`
          INSERT INTO message_reads (message_id, user_id, read_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (message_id, user_id) DO UPDATE SET read_at = NOW()
        `, [messageId, socket.user.id]);
      }

      // Update message status to 'read'
      await query(`
        UPDATE messages
        SET status = 'read'
        WHERE id = ANY($1::int[])
      `, [messageIds]);

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