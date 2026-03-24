// server/src/socket/index.js

const { verifyToken } = require('../utils/jwt');
const { query } = require('../config/database');
const messageHandler   = require('./handlers/messageHandler');
const presenceHandler  = require('./handlers/presenceHandler');
const callHandler      = require('./handlers/callHandler');
const reactionHandler  = require('./handlers/reactionHandler');

const initSocket = (io) => {
  // ── JWT auth middleware for Socket.IO ──────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided'));

      // Verify JWT token
      const tokenResult = verifyToken(token);
      if (!tokenResult.success) return next(new Error('Invalid token'));

      // Get user from database
      const userResult = await query(
        'SELECT id, email, name, avatar_url, about, is_online, last_seen FROM profiles WHERE id = $1',
        [tokenResult.userId]
      );

      if (userResult.rows.length === 0) {
        return next(new Error('User not found'));
      }

      const user = userResult.rows[0];
      socket.user = user;
      socket.profile = user;
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
    callHandler(socket, io);
    reactionHandler(socket, io);

    socket.on('disconnect', async () => {
      console.log(`Disconnected: ${socket.profile?.name}`);
      await presenceHandler.setOffline(socket, io);
    });
  });
};

module.exports = initSocket;