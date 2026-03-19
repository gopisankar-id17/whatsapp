const authenticate = require('../middleware/authenticate');
const {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  searchUsers,
  updateProfile,
  deleteConversation,
  acceptInvite,
  declineInvite,
} = require('../controllers/chat.controller');

async function chatRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/conversations',             getConversations);
  fastify.post('/conversations',            createConversation);
  fastify.delete('/conversations/:id',      deleteConversation);
  fastify.get('/messages/:conversationId',  getMessages);
  fastify.post('/messages',                 sendMessage);
  fastify.post('/conversations/:id/accept', acceptInvite);
  fastify.post('/conversations/:id/decline', declineInvite);
  fastify.get('/users/search',              searchUsers);
  fastify.put('/profile',                   updateProfile);
}

module.exports = chatRoutes;