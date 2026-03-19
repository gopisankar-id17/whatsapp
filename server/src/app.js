require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const { Server } = require('socket.io');
const initSocket = require('./socket');

// ── Plugins ───────────────────────────────────────────────────
fastify.register(require('@fastify/cors'), {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

fastify.register(require('@fastify/multipart'), {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ── Routes ────────────────────────────────────────────────────
fastify.register(require('./routes/auth.routes'),   { prefix: '/api/auth' });
fastify.register(require('./routes/chat.routes'),   { prefix: '/api' });
fastify.register(require('./routes/upload.routes'), { prefix: '/api/upload' });

// ── Health check ──────────────────────────────────────────────
fastify.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date(),
  service: 'whatsapp-server',
}));

fastify.get('/test-supabase', async (request, reply) => {
  const { supabaseAdmin } = require('./config/supabase');
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .limit(1);
    return reply.send({ data, error });
  } catch (err) {
    return reply.send({ err: err.message });
  }
});
// ── Start ─────────────────────────────────────────────────────
const start = async () => {
  try {
    const PORT = process.env.PORT || 3001;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });

    // Attach Socket.IO to Fastify's HTTP server
    const io = new Server(fastify.server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    initSocket(io);

    console.log(`Server running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();