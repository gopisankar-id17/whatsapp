const { supabaseAdmin } = require('../config/supabase');

const authenticate = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT with Supabase — returns user if valid
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }

    // Fetch profile from public.profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return reply.code(401).send({ error: 'User profile not found' });
    }

    // Attach to request for use in controllers
    request.user        = user;
    request.userProfile = profile;
    request.token       = token;
  } catch (err) {
    return reply.code(401).send({ error: 'Authentication failed', message: err.message });
  }
};

module.exports = authenticate;