'use strict';

const { Pool } = require('pg');

let pool = null;
let isInitialized = false;

// In-memory fallback if DATABASE_URL (Neon PostgreSQL) is not provided yet
const memorySessions = new Map();
const memoryMessages = new Map();

/**
 * Returns the pg.Pool instance if DATABASE_URL is configured.
 */
function getPool() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[chatbotDb] Unexpected pool error on idle client:', err.message);
    });
  }

  return pool;
}

/**
 * Ensures Neon PostgreSQL tables exist.
 * Safe to run multiple times.
 */
async function initializeChatbotSchema() {
  const p = getPool();
  if (!p) {
    console.log('[chatbotDb] DATABASE_URL not set. Using transient in-memory storage for chatbot sessions.');
    return;
  }

  try {
    const client = await p.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS chatbot_sessions (
          conversation_id VARCHAR(100) PRIMARY KEY,
          last_city VARCHAR(255),
          last_latitude DOUBLE PRECISION,
          last_longitude DOUBLE PRECISION,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

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
      isInitialized = true;
      console.log('[chatbotDb] Neon PostgreSQL chatbot schema initialized successfully.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('[chatbotDb] Failed to connect to Neon PostgreSQL, falling back to memory store:', err.message);
  }
}

/**
 * Retrieves the session object for a conversation_id.
 * @param {string} conversationId
 * @returns {Promise<{ conversation_id: string, last_city: string|null, last_latitude: number|null, last_longitude: number|null }>}
 */
async function getSession(conversationId) {
  if (!conversationId) return null;

  const p = getPool();
  if (p && isInitialized) {
    try {
      const res = await p.query(
        'SELECT conversation_id, last_city, last_latitude, last_longitude FROM chatbot_sessions WHERE conversation_id = $1',
        [conversationId]
      );
      if (res.rows.length > 0) {
        return res.rows[0];
      }
    } catch (err) {
      console.error('[chatbotDb/getSession] Error:', err.message);
    }
  }

  return memorySessions.get(conversationId) || {
    conversation_id: conversationId,
    last_city: null,
    last_latitude: null,
    last_longitude: null,
  };
}

/**
 * Upserts a session, recording the last discussed city and its coordinates.
 * @param {string} conversationId
 * @param {object} updates
 */
async function upsertSession(conversationId, { lastCity, lastLatitude, lastLongitude }) {
  if (!conversationId) return;

  const p = getPool();
  if (p && isInitialized) {
    try {
      await p.query(
        `INSERT INTO chatbot_sessions (conversation_id, last_city, last_latitude, last_longitude, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (conversation_id) DO UPDATE SET
           last_city = COALESCE($2, chatbot_sessions.last_city),
           last_latitude = COALESCE($3, chatbot_sessions.last_latitude),
           last_longitude = COALESCE($4, chatbot_sessions.last_longitude),
           updated_at = CURRENT_TIMESTAMP`,
        [conversationId, lastCity || null, lastLatitude ?? null, lastLongitude ?? null]
      );
      return;
    } catch (err) {
      console.error('[chatbotDb/upsertSession] Error:', err.message);
    }
  }

  // Memory fallback
  const existing = memorySessions.get(conversationId) || {
    conversation_id: conversationId,
    last_city: null,
    last_latitude: null,
    last_longitude: null,
  };

  memorySessions.set(conversationId, {
    conversation_id: conversationId,
    last_city: lastCity !== undefined ? lastCity : existing.last_city,
    last_latitude: lastLatitude !== undefined ? lastLatitude : existing.last_latitude,
    last_longitude: lastLongitude !== undefined ? lastLongitude : existing.last_longitude,
    updated_at: new Date(),
  });
}

/**
 * Saves a message (user or assistant) for a conversation session.
 * @param {string} conversationId
 * @param {'user'|'assistant'|'system'} role
 * @param {string} content
 */
async function saveMessage(conversationId, role, content) {
  if (!conversationId || !role || !content) return;

  // Ensure session exists
  await upsertSession(conversationId, {});

  const p = getPool();
  if (p && isInitialized) {
    try {
      await p.query(
        `INSERT INTO chatbot_messages (conversation_id, role, content)
         VALUES ($1, $2, $3)`,
        [conversationId, role, content]
      );
      return;
    } catch (err) {
      console.error('[chatbotDb/saveMessage] Error:', err.message);
    }
  }

  if (!memoryMessages.has(conversationId)) {
    memoryMessages.set(conversationId, []);
  }
  memoryMessages.get(conversationId).push({
    role,
    content,
    created_at: new Date(),
  });
}

/**
 * Retrieves the recent N messages for a conversation (for LLM context window memory).
 * @param {string} conversationId
 * @param {number} limit
 * @returns {Promise<Array<{ role: string, content: string }>>}
 */
async function getRecentMessages(conversationId, limit = 8) {
  if (!conversationId) return [];

  const p = getPool();
  if (p && isInitialized) {
    try {
      const res = await p.query(
        `SELECT role, content FROM (
           SELECT role, content, created_at
           FROM chatbot_messages
           WHERE conversation_id = $1
           ORDER BY created_at DESC
           LIMIT $2
         ) sub ORDER BY created_at ASC`,
        [conversationId, limit]
      );
      return res.rows.map((r) => ({ role: r.role, content: r.content }));
    } catch (err) {
      console.error('[chatbotDb/getRecentMessages] Error:', err.message);
    }
  }

  const list = memoryMessages.get(conversationId) || [];
  return list.slice(-limit).map((m) => ({ role: m.role, content: m.content }));
}

/**
 * Deletes a session and all its messages.
 * @param {string} conversationId
 */
async function clearSession(conversationId) {
  if (!conversationId) return;

  const p = getPool();
  if (p && isInitialized) {
    try {
      await p.query('DELETE FROM chatbot_sessions WHERE conversation_id = $1', [conversationId]);
      return;
    } catch (err) {
      console.error('[chatbotDb/clearSession] Error:', err.message);
    }
  }

  memorySessions.delete(conversationId);
  memoryMessages.delete(conversationId);
}

module.exports = {
  getPool,
  initializeChatbotSchema,
  getSession,
  upsertSession,
  saveMessage,
  getRecentMessages,
  clearSession,
};
