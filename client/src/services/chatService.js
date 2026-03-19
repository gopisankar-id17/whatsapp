import api from './api';

export const chatService = {
  // ── Conversations ──────────────────────────────────────────
  getConversations: () =>
    api.get('/api/conversations'),

  createConversation: (userId) =>
    api.post('/api/conversations', { userId }),

  // ── Messages ───────────────────────────────────────────────
  getMessages: (conversationId, page = 1, limit = 50) =>
    api.get(`/api/messages/${conversationId}`, { params: { page, limit } }),

  sendMessage: (conversationId, text, mediaUrl = '', mediaType = '') =>
    api.post('/api/messages', { conversationId, text, mediaUrl, mediaType }),

  // ── Users ──────────────────────────────────────────────────
  searchUsers: (query) =>
    api.get('/api/users/search', { params: { q: query } }),

  // ── Profile ────────────────────────────────────────────────
  updateProfile: (name, about, avatar_url) =>
    api.put('/api/profile', { name, about, avatar_url }),

  getMe: () =>
    api.get('/api/auth/me'),
};