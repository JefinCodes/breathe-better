'use strict';

/**
 * CLI script to initialize the Neon PostgreSQL schema for Breathe Better Chatbot.
 * Usage:
 *   node scripts/initChatbotDb.js
 *
 * Requirements:
 *   DATABASE_URL must be set in backend/.env or your environment:
 *   DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<db>?sslmode=require
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

async function run() {
  console.log('=== Breathe Better Chatbot Neon PostgreSQL Initializer ===\n');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is not set.');
    console.error('Please add DATABASE_URL to backend/.env like this:');
    console.error('DATABASE_URL=postgresql://user:password@ep-sample-12345.region.aws.neon.tech/neondb?sslmode=require\n');
    process.exit(1);
  }

  console.log('Connecting to Neon PostgreSQL database...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    console.log(' Connected to Neon PostgreSQL.');

    console.log('Creating "chatbot_sessions" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chatbot_sessions (
        conversation_id VARCHAR(100) PRIMARY KEY,
        last_city VARCHAR(255),
        last_latitude DOUBLE PRECISION,
        last_longitude DOUBLE PRECISION,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Creating "chatbot_messages" table & index...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chatbot_messages (
        id SERIAL PRIMARY KEY,
        conversation_id VARCHAR(100) REFERENCES chatbot_sessions(conversation_id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conv
        ON chatbot_messages(conversation_id, created_at ASC);
    `);

    console.log('Verifying table creation with test ping...');
    const res = await client.query('SELECT count(*) AS total_sessions FROM chatbot_sessions;');
    console.log(` Database verified! Existing session count: ${res.rows[0].total_sessions}`);

    client.release();
    await pool.end();
    console.log('\n Initialization complete. Neon PostgreSQL is ready for Breathe Better chatbot!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Database initialization failed:');
    console.error(err.message);
    if (err.stack) console.error(err.stack);
    await pool.end();
    process.exit(1);
  }
}

run();
