const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const { query } = require('../config/database');

// POST /api/auth/register
const register = async (request, reply) => {
  try {
    const { email, password, name } = request.body;

    // Validate input
    if (!email || !password || !name) {
      return reply.code(400).send({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return reply.code(400).send({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM profiles WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return reply.code(400).send({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await query(
      `INSERT INTO profiles (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, about, avatar_url, created_at`,
      [email.toLowerCase(), passwordHash, name]
    );

    const user = userResult.rows[0];

    // Generate JWT token
    const token = generateToken(user.id);

    return reply.code(201).send({
      user,
      token,
      message: 'Account created successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return reply.code(500).send({ error: 'Registration failed' });
  }
};

// POST /api/auth/login
const login = async (request, reply) => {
  try {
    const { email, password } = request.body;

    // Validate input
    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    // Find user
    const userResult = await query(
      'SELECT id, email, password_hash, name, about, avatar_url FROM profiles WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    // Update online status
    await query(
      'UPDATE profiles SET is_online = true, last_seen = NOW() WHERE id = $1',
      [user.id]
    );

    // Remove password hash from response
    delete user.password_hash;

    // Generate JWT token
    const token = generateToken(user.id);

    return reply.send({
      user,
      profile: user, // For compatibility
      token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return reply.code(500).send({ error: 'Login failed' });
  }
};

// POST /api/auth/logout
const logout = async (request, reply) => {
  try {
    const userId = request.user.id;

    // Update online status
    await query(
      'UPDATE profiles SET is_online = false, last_seen = NOW() WHERE id = $1',
      [userId]
    );

    return reply.send({ message: 'Logout successful' });

  } catch (error) {
    console.error('Logout error:', error);
    return reply.code(500).send({ error: 'Logout failed' });
  }
};

// GET /api/auth/me
const getMe = async (request, reply) => {
  try {
    const userId = request.user.id;

    // Get updated user info
    const userResult = await query(
      'SELECT id, email, name, about, avatar_url, is_online, last_seen FROM profiles WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return reply.code(404).send({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    return reply.send({
      user,
      profile: user // For compatibility
    });

  } catch (error) {
    console.error('Get me error:', error);
    return reply.code(500).send({ error: 'Failed to get user info' });
  }
};

// POST /api/auth/refresh (placeholder for compatibility)
const refreshToken = async (request, reply) => {
  return reply.code(501).send({ error: 'Refresh token not implemented with JWT' });
};

module.exports = { register, login, logout, refreshToken, getMe };