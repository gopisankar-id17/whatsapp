const { supabase, supabaseAdmin } = require('../config/supabase');

// POST /api/auth/register
const register = async (request, reply) => {
  try {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return reply.code(400).send({ error: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return reply.code(400).send({ error: 'Password must be at least 6 characters' });
    }

    // Register with Supabase Auth (triggers handle_new_user → creates profile)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // stored in raw_user_meta_data, used by DB trigger
      },
    });

    console.log('REGISTER RESULT:', JSON.stringify({ data, error }, null, 2));

    if (error) {
      console.error('REGISTER ERROR:', error);
      return reply.code(400).send({ error: error.message });
    }

    return reply.code(201).send({
      user: data.user,
      session: data.session,
      token: data.session?.access_token,
    });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Registration failed', message: err.message });
  }
};

// POST /api/auth/login
const login = async (request, reply) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return reply.code(401).send({ error: error.message });
    }

    // Fetch the user's profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return reply.send({
      user: data.user,
      profile,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: 'Login failed', message: err.message });
  }
};

// POST /api/auth/logout
const logout = async (request, reply) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return reply.code(400).send({ error: error.message });
    return reply.send({ message: 'Logged out successfully' });
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
};

// POST /api/auth/refresh
const refreshToken = async (request, reply) => {
  try {
    const { refreshToken } = request.body;

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error) return reply.code(401).send({ error: error.message });

    return reply.send({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
};

// GET /api/auth/me
const getMe = async (request, reply) => {
  return reply.send({
    user: request.user,
    profile: request.userProfile,
  });
};

module.exports = { register, login, logout, refreshToken, getMe };