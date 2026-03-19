require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const { Server } = require('socket.io');
const initSocket = require('./socket');

// Allowed origins: comma-separated CLIENT_URL; optionally allow all when ALLOW_ALL_ORIGINS=true
const allowedOriginsEnv = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowAllOrigins =
  process.env.ALLOW_ALL_ORIGINS === 'true' || allowedOriginsEnv.length === 0;

// Always include localhost for development when not fully open
const allowedOrigins = allowAllOrigins
  ? []
  : Array.from(new Set(['http://localhost:3000', ...allowedOriginsEnv]));

// ── Plugins ───────────────────────────────────────────────────
fastify.register(require('@fastify/cors'), {
  origin(origin, cb) {
    // Allow server-to-server (no origin) or explicitly allow all
    if (!origin || allowAllOrigins) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

fastify.register(require('@fastify/multipart'), {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ── Routes ────────────────────────────────────────────────────
fastify.register(require('./routes/auth.routes'), { prefix: '/api/auth' });
fastify.register(require('./routes/chat.routes'), { prefix: '/api' });
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
    const { data, error } = await supabaseAdmin.from('profiles').select('*').limit(1);
    return reply.send({ data, error });
  } catch (err) {
    return reply.send({ err: err.message });
  }
});

// ── Start Server ──────────────────────────────────────────────
const start = async () => {
  try {
    const PORT = process.env.PORT || 3001;

    await fastify.listen({ port: PORT, host: '0.0.0.0' });

    // Socket.IO shares the same CORS policy
    const io = new Server(fastify.server, {
      cors: {
        origin: allowAllOrigins ? true : allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    initSocket(io);

    console.log(`🚀 Server running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
