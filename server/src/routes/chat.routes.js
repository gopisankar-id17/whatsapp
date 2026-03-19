const authenticate = require('../middleware/authenticate');
const {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  searchUsers,
  updateProfile,
} = require('../controllers/chat.controller');

async function chatRoutes(fastify) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/conversations',             getConversations);
  fastify.post('/conversations',            createConversation);
  fastify.get('/messages/:conversationId',  getMessages);
  fastify.post('/messages',                 sendMessage);
  fastify.get('/users/search',              searchUsers);
  fastify.put('/profile',                   updateProfile);
}

module.exports = chatRoutes;