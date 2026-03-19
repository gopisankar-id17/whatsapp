const authenticate = require('../middleware/authenticate');
const { register, login, logout, refreshToken, getMe } = require('../controllers/auth.controller');

async function authRoutes(fastify) {
  fastify.post('/register', register);
  fastify.post('/login',    login);
  fastify.post('/logout',   logout);
  fastify.post('/refresh',  refreshToken);
  fastify.get('/me', { preHandler: [authenticate] }, getMe);
}

module.exports = authRoutes;