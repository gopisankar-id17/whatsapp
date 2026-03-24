const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { query } = require('../config/database');

const authenticate = async (request, reply) => {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return reply.code(401).send({ error: 'No token provided' });
    }

    // Verify JWT token
    const tokenResult = verifyToken(token);
    if (!tokenResult.success) {
      return reply.code(401).send({ error: 'Invalid token' });
    }

    // Get user from database
    const userResult = await query(
      'SELECT id, email, name, avatar_url, about, is_online, last_seen FROM profiles WHERE id = $1',
      [tokenResult.userId]
    );

    if (userResult.rows.length === 0) {
      return reply.code(401).send({ error: 'User not found' });
    }

    // Attach user to request (compatible with existing code)
    const user = userResult.rows[0];
    request.user = user;
    request.userProfile = user;
    request.profile = user;
    request.token = token;

  } catch (error) {
    console.error('Authentication error:', error);
    return reply.code(500).send({ error: 'Authentication failed' });
  }
};

module.exports = authenticate;