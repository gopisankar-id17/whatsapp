const authenticate = require('../middleware/authenticate');
const { uploadMedia, deleteMedia } = require('../controllers/upload.controller');

async function uploadRoutes(fastify) {
  fastify.post('/media',   { preHandler: [authenticate] }, uploadMedia);
  fastify.delete('/media', { preHandler: [authenticate] }, deleteMedia);
}

module.exports = uploadRoutes;