const { query } = require('../config/database');
const notificationService = require('../services/notificationService');

// GET /api/conversations
const getConversations = async (request, reply) => {
  try {
    const userId = request.user.id;

    // Get conversations for this user
    const conversationsResult = await query(`
      SELECT c.id, c.is_group, c.created_at, c.last_message_at, cp.status as my_status
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = $1
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    `, [userId]);

    // For each conversation, get participants and latest message
    const conversationsWithDetails = await Promise.all(
      conversationsResult.rows.map(async (conversation) => {
        // Get participants for this conversation
        const participantsResult = await query(`
          SELECT cp.user_id, cp.status,
                 p.id, p.name, p.avatar_url, p.is_online, p.last_seen
          FROM conversation_participants cp
          JOIN profiles p ON cp.user_id = p.id
          WHERE cp.conversation_id = $1
        `, [conversation.id]);

        // Format participants
        const conversation_participants = participantsResult.rows.map(row => ({
          user_id: row.user_id,
          status: row.status,
          profiles: {
            id: row.id,
            name: row.name,
            avatar_url: row.avatar_url,
            is_online: row.is_online,
            last_seen: row.last_seen
          }
        }));

        // Get latest message
        const latestMessageResult = await query(`
          SELECT m.id, m.text, m.media_url, m.media_type, m.created_at,
                 m.sender_id, m.status,
                 p.id as profile_id, p.name as profile_name
          FROM messages m
          LEFT JOIN profiles p ON m.sender_id = p.id
          WHERE m.conversation_id = $1
          ORDER BY m.created_at DESC
          LIMIT 1
        `, [conversation.id]);

        let messages = [];
        if (latestMessageResult.rows.length > 0) {
          const msg = latestMessageResult.rows[0];
          messages = [{
            id: msg.id,
            text: msg.text,
            media_url: msg.media_url,
            media_type: msg.media_type,
            created_at: msg.created_at,
            sender_id: msg.sender_id,
            status: msg.status,
            profiles: {
              id: msg.profile_id,
              name: msg.profile_name
            }
          }];
        }

        return {
          ...conversation,
          conversation_participants,
          messages
        };
      })
    );

    // Calculate unread counts for each conversation
    const conversationsWithUnreadCount = await Promise.all(
      conversationsWithDetails.map(async (conversation) => {
        let unreadCount = 0;

        try {
          // Get user's last read status for this conversation
          const readStatusResult = await query(`
            SELECT last_read_message_id, last_read_at
            FROM conversation_read_status
            WHERE conversation_id = $1 AND user_id = $2
          `, [conversation.id, userId]);

          if (readStatusResult.rows.length > 0 && readStatusResult.rows[0].last_read_message_id) {
            // Count messages after the last read message
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
              `, [conversation.id, userId, lastReadMsgResult.rows[0].created_at]);

              unreadCount = parseInt(unreadResult.rows[0].count) || 0;
            }
          } else {
            // No read status - count all messages from others
            const unreadResult = await query(`
              SELECT COUNT(*) as count
              FROM messages
              WHERE conversation_id = $1 AND sender_id != $2
            `, [conversation.id, userId]);

            unreadCount = parseInt(unreadResult.rows[0].count) || 0;
          }
        } catch (error) {
          console.warn('Unread count calculation failed:', error.message);
          unreadCount = 0;
        }

        return {
          ...conversation,
          unread_count: unreadCount
        };
      })
    );

    return reply.send({ conversations: conversationsWithUnreadCount });
  } catch (err) {
    console.error('Get conversations error:', err);
    return reply.code(500).send({ error: err.message });
  }
};

// POST /api/conversations
const createConversation = async (request, reply) => {
  try {
    const { userId } = request.body;
    const myId = request.user.id;

    if (userId === myId) {
      return reply.code(400).send({ error: 'Cannot create conversation with yourself' });
    }

    // Check if conversation already exists between these two users
    const existingResult = await query(`
      SELECT c.id, c.*,
             json_agg(
               json_build_object(
                 'user_id', cp.user_id,
                 'status', cp.status,
                 'profiles', json_build_object(
                   'id', p.id,
                   'name', p.name,
                   'avatar_url', p.avatar_url,
                   'is_online', p.is_online,
                   'last_seen', p.last_seen
                 )
               )
             ) as conversation_participants
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      JOIN profiles p ON cp.user_id = p.id
      WHERE c.is_group = false
        AND c.id IN (
          SELECT conversation_id FROM conversation_participants WHERE user_id = $1
          INTERSECT
          SELECT conversation_id FROM conversation_participants WHERE user_id = $2
        )
      GROUP BY c.id
      LIMIT 1
    `, [myId, userId]);

    if (existingResult.rows.length > 0) {
      return reply.send({ conversation: existingResult.rows[0] });
    }

    // Create new conversation
    const conversationResult = await query(`
      INSERT INTO conversations (is_group, created_at, last_message_at)
      VALUES (false, NOW(), NOW())
      RETURNING *
    `);

    const conversationId = conversationResult.rows[0].id;

    // Add both participants
    await query(`
      INSERT INTO conversation_participants (conversation_id, user_id, status)
      VALUES ($1, $2, 'accepted'), ($1, $3, 'pending')
    `, [conversationId, myId, userId]);

    // Return populated conversation
    const populatedResult = await query(`
      SELECT c.*,
             json_agg(
               json_build_object(
                 'user_id', cp.user_id,
                 'status', cp.status,
                 'profiles', json_build_object(
                   'id', p.id,
                   'name', p.name,
                   'avatar_url', p.avatar_url,
                   'is_online', p.is_online,
                   'last_seen', p.last_seen
                 )
               )
             ) as conversation_participants
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      JOIN profiles p ON cp.user_id = p.id
      WHERE c.id = $1
      GROUP BY c.id
    `, [conversationId]);

    const createdConversation = populatedResult.rows[0];

    // Notify the recipient about the new conversation invitation
    notificationService.notifyUser(userId, 'conversation_invitation', {
      conversation: createdConversation,
      from: {
        id: myId,
        name: request.user.name || 'User'
      },
      message: 'You have a new conversation invitation'
    });

    console.log(`[Chat Controller] Notified user ${userId} about new conversation invitation from ${myId}`);

    // ALSO notify the sender (current user) to update their conversation list
    notificationService.notifyUser(myId, 'conversation_created_by_me', {
      conversation: createdConversation,
      message: 'Conversation invitation sent'
    });

    console.log(`[Chat Controller] Notified sender ${myId} about their own conversation creation`);

    return reply.code(201).send({ conversation: createdConversation });
  } catch (err) {
    console.error('Create conversation error:', err);
    return reply.code(500).send({ error: err.message });
  }
};

// GET /api/messages/:conversationId
const getMessages = async (request, reply) => {
  try {
    const { conversationId } = request.params;
    const { page = 1, limit = 50 } = request.query;
    const offset = (page - 1) * limit;

    const messagesResult = await query(`
      SELECT m.*,
             json_build_object(
               'id', p.id,
               'name', p.name,
               'avatar_url', p.avatar_url
             ) as profiles
      FROM messages m
      LEFT JOIN profiles p ON m.sender_id = p.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC
      LIMIT $2 OFFSET $3
    `, [conversationId, limit, offset]);

    return reply.send({ messages: messagesResult.rows });
  } catch (err) {
    console.error('Get messages error:', err);
    return reply.code(500).send({ error: err.message });
  }
};

// POST /api/messages
const sendMessage = async (request, reply) => {
  try {
    const { conversationId, text, mediaUrl, mediaType } = request.body;
    const senderId = request.user.id;

    if (!conversationId || (!text && !mediaUrl)) {
      return reply.code(400).send({ error: 'conversationId and text or mediaUrl required' });
    }

    // Check if recipient has accepted the conversation
    const participantsResult = await query(`
      SELECT user_id, status
      FROM conversation_participants
      WHERE conversation_id = $1
    `, [conversationId]);

    const recipientPending = participantsResult.rows.some(
      (p) => String(p.user_id) !== String(senderId) && p.status === 'pending'
    );

    if (recipientPending) {
      return reply.code(403).send({ error: 'Recipient has not accepted the invite yet' });
    }

    // Insert message
    const messageResult = await query(`
      INSERT INTO messages (conversation_id, sender_id, text, media_url, media_type, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'sent', NOW())
      RETURNING *
    `, [conversationId, senderId, text || '', mediaUrl || '', mediaType || '']);

    // Get message with profile info
    const messageWithProfile = await query(`
      SELECT m.*,
             json_build_object(
               'id', p.id,
               'name', p.name,
               'avatar_url', p.avatar_url
             ) as profiles
      FROM messages m
      LEFT JOIN profiles p ON m.sender_id = p.id
      WHERE m.id = $1
    `, [messageResult.rows[0].id]);

    // Update conversation last_message_at
    await query(`
      UPDATE conversations
      SET last_message_at = NOW()
      WHERE id = $1
    `, [conversationId]);

    return reply.code(201).send({ message: messageWithProfile.rows[0] });
  } catch (err) {
    console.error('Send message error:', err);
    return reply.code(500).send({ error: err.message });
  }
};

// GET /api/users/search?q=
const searchUsers = async (request, reply) => {
  try {
    const { q } = request.query;
    const myId = request.user.id;

    if (!q || q.length < 2) {
      return reply.send({ users: [] });
    }

    // Search by name or email
    const searchTerm = `%${q}%`;

    const usersResult = await query(`
      SELECT id, name, avatar_url, is_online, last_seen, email
      FROM profiles
      WHERE (name ILIKE $1 OR email ILIKE $1)
        AND id != $2
      ORDER BY name
      LIMIT 10
    `, [searchTerm, myId]);

    return reply.send({ users: usersResult.rows });
  } catch (err) {
    console.error('Search users error:', err);
    return reply.code(500).send({ error: err.message });
  }
};

// PUT /api/profile
const updateProfile = async (request, reply) => {
  try {
    const { name, about, avatar_url } = request.body;
    const userId = request.user.id;

    const profileResult = await query(`
      UPDATE profiles
      SET name = $1, about = $2, avatar_url = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [name, about, avatar_url, userId]);

    if (profileResult.rows.length === 0) {
      return reply.code(404).send({ error: 'Profile not found' });
    }

    return reply.send({ profile: profileResult.rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    return reply.code(500).send({ error: err.message });
  }
};

// DELETE /api/conversations/:id
const deleteConversation = async (request, reply) => {
  try {
    const { id } = request.params;
    const userId = request.user.id;

    // Check if user is participant
    const participantResult = await query(`
      SELECT conversation_id
      FROM conversation_participants
      WHERE conversation_id = $1 AND user_id = $2
    `, [id, userId]);

    if (participantResult.rows.length === 0) {
      return reply.code(403).send({ error: 'Not allowed' });
    }

    // Delete in proper order (child tables first)
    await query('DELETE FROM conversation_read_status WHERE conversation_id = $1', [id]);
    await query('DELETE FROM message_reactions WHERE message_id IN (SELECT id FROM messages WHERE conversation_id = $1)', [id]);
    await query('DELETE FROM messages WHERE conversation_id = $1', [id]);
    await query('DELETE FROM conversation_participants WHERE conversation_id = $1', [id]);
    await query('DELETE FROM conversations WHERE id = $1', [id]);

    return reply.send({ success: true });
  } catch (err) {
    console.error('Delete conversation error:', err);
    return reply.code(500).send({ error: err.message });
  }
};

// POST /api/conversations/:id/accept
const acceptInvite = async (request, reply) => {
  try {
    const { id } = request.params;
    const userId = request.user.id;

    // Update conversation status
    await query(`
      UPDATE conversation_participants
      SET status = 'accepted'
      WHERE conversation_id = $1 AND user_id = $2
    `, [id, userId]);

    // Get the other participant (sender) to notify them
    const otherParticipantResult = await query(`
      SELECT cp.user_id, p.name
      FROM conversation_participants cp
      JOIN profiles p ON cp.user_id = p.id
      WHERE cp.conversation_id = $1 AND cp.user_id != $2
    `, [id, userId]);

    if (otherParticipantResult.rows.length > 0) {
      const sender = otherParticipantResult.rows[0];

      // Notify the sender that their invitation was accepted
      notificationService.notifyUser(sender.user_id, 'conversation_accepted', {
        conversationId: id,
        acceptedBy: {
          id: userId,
          name: request.user.name || 'User'
        },
        message: `${request.user.name || 'User'} accepted your conversation invitation`
      });

      console.log(`[Chat Controller] Notified user ${sender.user_id} that conversation was accepted by ${userId}`);
    }

    return reply.send({ success: true });
  } catch (err) {
    console.error('Accept invite error:', err);
    return reply.code(500).send({ error: err.message });
  }
};

// POST /api/conversations/:id/decline
const declineInvite = async (request, reply) => {
  try {
    const { id } = request.params;
    const userId = request.user.id;

    // Get the other participant (sender) before removing ourselves
    const otherParticipantResult = await query(`
      SELECT cp.user_id, p.name
      FROM conversation_participants cp
      JOIN profiles p ON cp.user_id = p.id
      WHERE cp.conversation_id = $1 AND cp.user_id != $2
    `, [id, userId]);

    // Remove the participant
    await query(`
      DELETE FROM conversation_participants
      WHERE conversation_id = $1 AND user_id = $2
    `, [id, userId]);

    // Check if any participants remain
    const remainingResult = await query(`
      SELECT COUNT(*) as count
      FROM conversation_participants
      WHERE conversation_id = $1
    `, [id]);

    // If no participants left, delete the entire conversation
    if (parseInt(remainingResult.rows[0].count) === 0) {
      await query('DELETE FROM message_reactions WHERE message_id IN (SELECT id FROM messages WHERE conversation_id = $1)', [id]);
      await query('DELETE FROM messages WHERE conversation_id = $1', [id]);
      await query('DELETE FROM conversations WHERE id = $1', [id]);
    }

    // Notify the sender that their invitation was declined
    if (otherParticipantResult.rows.length > 0) {
      const sender = otherParticipantResult.rows[0];

      notificationService.notifyUser(sender.user_id, 'conversation_declined', {
        conversationId: id,
        declinedBy: {
          id: userId,
          name: request.user.name || 'User'
        },
        message: `${request.user.name || 'User'} declined your conversation invitation`
      });

      console.log(`[Chat Controller] Notified user ${sender.user_id} that conversation was declined by ${userId}`);
    }

    return reply.send({ success: true });
  } catch (err) {
    console.error('Decline invite error:', err);
    return reply.code(500).send({ error: err.message });
  }
};

// POST /api/conversations/:id/mark-read
const markConversationAsRead = async (request, reply) => {
  try {
    const { id: conversationId } = request.params;
    const userId = request.user.id;

    // Get the latest message in this conversation
    const latestMessageResult = await query(`
      SELECT id, created_at
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [conversationId]);

    if (latestMessageResult.rows.length === 0) {
      return reply.send({ success: true }); // No messages to mark as read
    }

    const latestMessage = latestMessageResult.rows[0];

    // Upsert read status
    await query(`
      INSERT INTO conversation_read_status (conversation_id, user_id, last_read_message_id, last_read_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (conversation_id, user_id)
      DO UPDATE SET
        last_read_message_id = EXCLUDED.last_read_message_id,
        last_read_at = EXCLUDED.last_read_at
    `, [conversationId, userId, latestMessage.id]);

    return reply.send({ success: true });
  } catch (err) {
    console.error('Mark conversation as read error:', err);
    // Fail silently for backwards compatibility
    return reply.send({ success: true });
  }
};

module.exports = {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  searchUsers,
  updateProfile,
  deleteConversation,
  acceptInvite,
  declineInvite,
  markConversationAsRead,
};