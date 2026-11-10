'use strict';

/**
 * CLI script to initialize the Neon PostgreSQL schema for Breathe Better Locality feature.
 * Usage:
 *   node scripts/initLocalityDb.js
 *
 * Requirements:
 *   DATABASE_URL must be set in backend/.env or your environment:
 *   DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<db>?sslmode=require
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

async function run() {
  console.log('=== Breathe Better Locality Neon PostgreSQL Initializer ===\n');

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
    console.log('✔ Connected to Neon PostgreSQL.');

    const sqlPath = path.join(__dirname, '..', 'db', 'locality_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing Locality tables schema migration...');
    await client.query(sql);

    console.log('Verifying table creation with test queries...');
    const usersRes = await client.query('SELECT count(*) AS total_users FROM locality_users;');
    const threadsRes = await client.query('SELECT count(*) AS total_threads FROM pollution_threads;');
    console.log(`✔ Verified! Existing users: ${usersRes.rows[0].total_users}, existing threads: ${threadsRes.rows[0].total_threads}`);

    client.release();
    await pool.end();
    console.log('\n🎉 Initialization complete. Locality tables are ready in Neon PostgreSQL!');
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
