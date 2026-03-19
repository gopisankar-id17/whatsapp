const { supabaseAdmin } = require('../config/supabase');

// GET /api/conversations
const getConversations = async (request, reply) => {
  try {
    const userId = request.user.id;

    // Get all conversation IDs where user is a participant
    const { data: participantRows, error: pErr } = await supabaseAdmin
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (pErr) return reply.code(500).send({ error: pErr.message });

    const conversationIds = participantRows.map(r => r.conversation_id);
    if (conversationIds.length === 0) return reply.send({ conversations: [] });

    // Fetch conversations with participants and last message
    const { data: conversations, error: cErr } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        conversation_participants (
          user_id,
          profiles (id, name, avatar_url, is_online, last_seen)
        ),
        messages (
          id, text, media_url, media_type, created_at,
          profiles (id, name)
        )
      `)
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false })
      .order('created_at', { foreignTable: 'messages', ascending: false })
      .limit(1, { foreignTable: 'messages' });

    if (cErr) return reply.code(500).send({ error: cErr.message });

    return reply.send({ conversations });
  } catch (err) {
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
    const { data: existing } = await supabaseAdmin
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', myId);

    if (existing && existing.length > 0) {
      const myConvIds = existing.map(r => r.conversation_id);

      const { data: shared } = await supabaseAdmin
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId)
        .in('conversation_id', myConvIds);

      if (shared && shared.length > 0) {
        const { data: conv } = await supabaseAdmin
          .from('conversations')
          .select(`*, conversation_participants(user_id, profiles(id, name, avatar_url, is_online, last_seen))`)
          .eq('id', shared[0].conversation_id)
          .eq('is_group', false)
          .single();

        if (conv) return reply.send({ conversation: conv });
      }
    }

    // Create new conversation
    const { data: conversation, error: convErr } = await supabaseAdmin
      .from('conversations')
      .insert({ is_group: false })
      .select()
      .single();

    if (convErr) return reply.code(500).send({ error: convErr.message });

    // Add both participants
    const { error: partErr } = await supabaseAdmin
      .from('conversation_participants')
      .insert([
        { conversation_id: conversation.id, user_id: myId },
        { conversation_id: conversation.id, user_id: userId },
      ]);

    if (partErr) return reply.code(500).send({ error: partErr.message });

    // Return populated conversation
    const { data: populated } = await supabaseAdmin
      .from('conversations')
      .select(`*, conversation_participants(user_id, profiles(id, name, avatar_url, is_online, last_seen))`)
      .eq('id', conversation.id)
      .single();

    return reply.code(201).send({ conversation: populated });
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
};

// GET /api/messages/:conversationId
const getMessages = async (request, reply) => {
  try {
    const { conversationId } = request.params;
    const { page = 1, limit = 50 } = request.query;
    const offset = (page - 1) * limit;

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`*, profiles(id, name, avatar_url)`)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + Number(limit) - 1);

    if (error) return reply.code(500).send({ error: error.message });

    return reply.send({ messages });
  } catch (err) {
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

    const { data: message, error: msgErr } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        text: text || '',
        media_url: mediaUrl || '',
        media_type: mediaType || '',
        status: 'sent',
      })
      .select(`*, profiles(id, name, avatar_url)`)
      .single();

    if (msgErr) return reply.code(500).send({ error: msgErr.message });

    // Update conversation last_message_at
    await supabaseAdmin
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return reply.code(201).send({ message });
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
};

// GET /api/users/search?q=
const searchUsers = async (request, reply) => {
  try {
    const { q } = request.query;
    const myId = request.user.id;

    if (!q || q.length < 2) return reply.send({ users: [] });

    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, avatar_url, is_online, last_seen')
      .ilike('name', `%${q}%`)
      .neq('id', myId)
      .limit(10);

    if (error) return reply.code(500).send({ error: error.message });

    return reply.send({ users });
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
};

// PUT /api/profile
const updateProfile = async (request, reply) => {
  try {
    const { name, about, avatar_url } = request.body;
    const userId = request.user.id;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update({ name, about, avatar_url })
      .eq('id', userId)
      .select()
      .single();

    if (error) return reply.code(500).send({ error: error.message });

    return reply.send({ profile });
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
};

module.exports = {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  searchUsers,
  updateProfile,
};