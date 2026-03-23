// server/src/socket/index.js  (FULL UPDATED FILE)

const { supabaseAdmin } = require('../config/supabase');
const messageHandler   = require('./handlers/messageHandler');
const presenceHandler  = require('./handlers/presenceHandler');
const callHandler      = require('./handlers/callHandler');

const initSocket = (io) => {
  // ── Supabase JWT auth middleware ──────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) return next(new Error('Invalid token'));

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      socket.user    = user;
      socket.profile = profile;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // ── On connection ─────────────────────────────────────────────────────────
  io.on('connection', async (socket) => {
    console.log(`Connected: ${socket.profile?.name} (${socket.id})`);

    await presenceHandler.setOnline(socket, io);

    // Personal room — used by callHandler to reach this user directly
    socket.join(socket.user.id);

    messageHandler(socket, io);
    callHandler(socket, io);   // ← NEW

    socket.on('disconnect', async () => {
      console.log(`Disconnected: ${socket.profile?.name}`);
      await presenceHandler.setOffline(socket, io);
    });
  });
};

module.exports = initSocket;