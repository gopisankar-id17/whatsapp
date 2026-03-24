const { query } = require('../../config/database');

const setOnline = async (socket, io) => {
  try {
    await query(
      'UPDATE profiles SET is_online = true, last_seen = NOW() WHERE id = $1',
      [socket.user.id]
    );

    io.emit('user_status', {
      userId: socket.user.id,
      isOnline: true,
    });
  } catch (err) {
    console.error('setOnline error:', err);
  }
};

const setOffline = async (socket, io) => {
  try {
    const result = await query(
      'UPDATE profiles SET is_online = false, last_seen = NOW() WHERE id = $1 RETURNING last_seen',
      [socket.user.id]
    );

    const lastSeen = result.rows[0]?.last_seen || new Date().toISOString();

    io.emit('user_status', {
      userId: socket.user.id,
      isOnline: false,
      lastSeen: lastSeen,
    });
  } catch (err) {
    console.error('setOffline error:', err);
  }
};

module.exports = { setOnline, setOffline };