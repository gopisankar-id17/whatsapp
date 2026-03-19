require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const { Server } = require('socket.io');
const initSocket = require('./socket');

// ✅ Allow multiple origins (LOCAL + VERCEL)
const allowedOrigins = (
  process.env.CLIENT_URL ||
  'http://localhost:3000,https://whatsapp-peach-three.vercel.app'
).split(',');

// ── Plugins ───────────────────────────────────────────────────
fastify.register(require('@fastify/cors'), {
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  origin: (origin, cb) => {
    // allow requests with no origin (like mobile apps / curl)
    if (!origin) return cb(null, true);
    origin(origin, cb) {
      // Allow same-origin or server-to-server (no Origin header)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    if (allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'), false);
    }
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

// ── Test Supabase ─────────────────────────────────────────────
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

// ── Start Server ──────────────────────────────────────────────
const start = async () => {
  try {
    const PORT = process.env.PORT || 3001;

    await fastify.listen({
      port: PORT,
        cors: {
          origin: allowedOrigins,
          methods: ['GET', 'POST'],
          credentials: true,
        },
      cors: {
        origin: (origin, cb) => {
          if (!origin) return cb(null, true);

          if (allowedOrigins.includes(origin)) {
            cb(null, true);
          } else {
            cb(new Error('Socket CORS not allowed'), false);
          }
        },
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