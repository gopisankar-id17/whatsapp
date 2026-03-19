const { supabaseAdmin } = require('../../config/supabase');

const setOnline = async (socket, io) => {
  try {
    await supabaseAdmin
      .from('profiles')
      .update({ is_online: true, last_seen: new Date().toISOString() })
      .eq('id', socket.user.id);

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
    const now = new Date().toISOString();

    await supabaseAdmin
      .from('profiles')
      .update({ is_online: false, last_seen: now })
      .eq('id', socket.user.id);

    io.emit('user_status', {
      userId: socket.user.id,
      isOnline: false,
      lastSeen: now,
    });
  } catch (err) {
    console.error('setOffline error:', err);
  }
};

module.exports = { setOnline, setOffline };