const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Initialize database by running the schema
const initializeDatabase = async () => {
  try {
    console.log('🚀 Initializing Neon database...');

    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'schema', 'neon-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema (ignore errors for existing objects)
    try {
      await query(schema);
      
      // Migration: Ensure 'about' column exists
      try {
        await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about TEXT DEFAULT \'Hey there! I am using WhatsApp.\'');
        console.log('✅ Checked/Added "about" column to profiles');
      } catch (err) {
        console.warn('⚠️ Error adding "about" column:', err.message);
      }

      // Migration: Ensure 'avatar_url' column exists
      try {
        await query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT');
        console.log('✅ Checked/Added "avatar_url" column to profiles');
      } catch (err) {
        console.warn('⚠️ Error adding "avatar_url" column:', err.message);
      }

    } catch (error) {
      // Ignore errors about objects that already exist
      if (error.message.includes('already exists') || error.code === '42710') {
        console.log('⚠️ Some database objects already exist - continuing...');
      } else {
        throw error;
      }
    }

    console.log('✅ Database initialized successfully!');

    // Create a test user for development
    await createTestUser();

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Create a test user for development
const createTestUser = async () => {
  try {
    const bcrypt = require('bcryptjs');

    // Check if test user already exists
    const existingUser = await query(
      'SELECT id FROM profiles WHERE email = $1',
      ['test@example.com']
    );

    if (existingUser.rows.length > 0) {
      console.log('📧 Test user already exists');
      return;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);

    await query(
      `INSERT INTO profiles (email, password_hash, name, about)
       VALUES ($1, $2, $3, $4)`,
      [
        'test@example.com',
        hashedPassword,
        'Test User',
        'Hey there! I am using WhatsApp.'
      ]
    );

    console.log('👤 Test user created: test@example.com / password123');

  } catch (error) {
    console.error('❌ Failed to create test user:', error);
  }
};

// Check database connection
const checkConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('🔗 Database connected at:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

module.exports = {
  initializeDatabase,
  checkConnection,
  createTestUser
};