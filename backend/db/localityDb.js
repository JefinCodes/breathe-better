'use strict';

const crypto = require('crypto');
const { getPool } = require('./chatbotDb');

// In-memory fallback if Neon is temporarily unreachable on certain Wi-Fi networks
const memoryUsers = new Map();
const memoryLocalities = new Map();
const memoryThreads = new Map();
let nextThreadId = 1;
const memoryMessages = new Map();
let nextMessageId = 1;
const memoryNotifications = new Map();
let nextNotificationId = 1;

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula.
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ---------------------------------------------------------------------------
// Password & Token utilities (Built-in Node crypto, zero extra dependencies)
// ---------------------------------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET || 'breathe-better-locality-super-secret-key-2026';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// User Operations
// ---------------------------------------------------------------------------
async function findUserByEmail(email) {
  if (!email) return null;
  const normalizedEmail = email.toLowerCase().trim();
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM locality_users WHERE LOWER(email) = $1', [normalizedEmail]);
      if (res.rows.length > 0) return res.rows[0];
    } catch (err) {
      console.warn('[localityDb] findUserByEmail DB error, using fallback:', err.message);
    }
  }

  for (const user of memoryUsers.values()) {
    if (user.email.toLowerCase() === normalizedEmail) return user;
  }
  return null;
}

async function findUserByUsername(username) {
  if (!username) return null;
  const normalizedUsername = username.toLowerCase().trim();
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM locality_users WHERE LOWER(username) = $1', [normalizedUsername]);
      if (res.rows.length > 0) return res.rows[0];
    } catch (err) {
      console.warn('[localityDb] findUserByUsername DB error, using fallback:', err.message);
    }
  }

  for (const user of memoryUsers.values()) {
    if (user.username.toLowerCase() === normalizedUsername) return user;
  }
  return null;
}

async function findUserByGoogleId(googleId) {
  if (!googleId) return null;
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM locality_users WHERE google_id = $1', [googleId]);
      if (res.rows.length > 0) return res.rows[0];
    } catch (err) {
      console.warn('[localityDb] findUserByGoogleId DB error, using fallback:', err.message);
    }
  }

  for (const user of memoryUsers.values()) {
    if (user.google_id === googleId) return user;
  }
  return null;
}

async function findUserById(id) {
  if (!id) return null;
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM locality_users WHERE id = $1', [id]);
      if (res.rows.length > 0) return res.rows[0];
    } catch (err) {
      console.warn('[localityDb] findUserById DB error, using fallback:', err.message);
    }
  }
  return memoryUsers.get(id) || null;
}

async function createUser({ username, email, password, googleId = null }) {
  const id = crypto.randomUUID();
  const passwordHash = password ? hashPassword(password) : null;
  const pool = getPool();

  if (pool) {
    try {
      const res = await pool.query(
        `INSERT INTO locality_users (id, username, email, password_hash, google_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [id, username.trim(), email.toLowerCase().trim(), passwordHash, googleId]
      );
      return res.rows[0];
    } catch (err) {
      console.warn('[localityDb] createUser DB error, saving to memory fallback:', err.message);
    }
  }

  const user = {
    id,
    username: username.trim(),
    email: email.toLowerCase().trim(),
    password_hash: passwordHash,
    google_id: googleId,
    created_at: new Date(),
    updated_at: new Date(),
  };
  memoryUsers.set(id, user);
  return user;
}

// ---------------------------------------------------------------------------
// Locality Settings Operations
// ---------------------------------------------------------------------------
async function getUserLocality(userId) {
  if (!userId) return null;
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query('SELECT * FROM user_localities WHERE user_id = $1', [userId]);
      if (res.rows.length > 0) return res.rows[0];
    } catch (err) {
      console.warn('[localityDb] getUserLocality DB error, using fallback:', err.message);
    }
  }
  return memoryLocalities.get(userId) || null;
}

async function upsertUserLocality(userId, { localityName, latitude, longitude, radiusKm = 5.0 }) {
  if (!userId) return null;
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `INSERT INTO user_localities (user_id, locality_name, latitude, longitude, radius_km, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           locality_name = EXCLUDED.locality_name,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           radius_km = EXCLUDED.radius_km,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userId, localityName || 'My Locality', latitude, longitude, radiusKm]
      );
      return res.rows[0];
    } catch (err) {
      console.warn('[localityDb] upsertUserLocality DB error, saving to memory fallback:', err.message);
    }
  }

  const loc = {
    user_id: userId,
    locality_name: localityName || 'My Locality',
    latitude,
    longitude,
    radius_km: radiusKm,
    updated_at: new Date(),
  };
  memoryLocalities.set(userId, loc);
  return loc;
}

// ---------------------------------------------------------------------------
// Pollution Threads Operations
// ---------------------------------------------------------------------------
async function getThreadsInLocality({ latitude, longitude, radiusKm = 50.0 }) {
  const pool = getPool();
  let threads = [];

  if (pool) {
    try {
      const res = await pool.query(
        `SELECT
           t.id,
           t.user_id,
           t.username,
           t.title,
           t.description,
           t.latitude,
           t.longitude,
           t.status,
           t.created_at,
           t.updated_at,
           COUNT(m.id)::int AS message_count,
           COUNT(r.id)::int AS resolve_notifications_count
         FROM pollution_threads t
         LEFT JOIN pollution_messages m ON m.thread_id = t.id
         LEFT JOIN thread_resolve_notifications r ON r.thread_id = t.id
         GROUP BY t.id
         ORDER BY message_count DESC, t.created_at DESC`
      );
      threads = res.rows;
    } catch (err) {
      console.warn('[localityDb] getThreadsInLocality DB error, using fallback:', err.message);
      threads = Array.from(memoryThreads.values());
    }
  } else {
    threads = Array.from(memoryThreads.values());
  }

  // Calculate distances & filter within radius (or include distance tag)
  return threads
    .map((t) => {
      const distance = haversineDistanceKm(latitude, longitude, t.latitude, t.longitude);
      const msgCount = t.message_count !== undefined ? Number(t.message_count) : getMemoryMessageCount(t.id);
      const resolveCount =
        t.resolve_notifications_count !== undefined
          ? Number(t.resolve_notifications_count)
          : getMemoryResolveCount(t.id);
      return {
        ...t,
        distance_km: Math.round(distance * 10) / 10,
        message_count: msgCount,
        resolve_notifications_count: resolveCount,
      };
    })
    .filter((t) => !radiusKm || t.distance_km <= radiusKm)
    .sort((a, b) => b.message_count - a.message_count); // Sort by popularity (message count)
}

function getMemoryMessageCount(threadId) {
  let count = 0;
  for (const m of memoryMessages.values()) {
    if (m.thread_id === threadId) count++;
  }
  return count;
}

function getMemoryResolveCount(threadId) {
  let count = 0;
  for (const r of memoryNotifications.values()) {
    if (r.thread_id === threadId) count++;
  }
  return count;
}

async function getThreadById(threadId) {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT
           t.id,
           t.user_id,
           t.username,
           t.title,
           t.description,
           t.latitude,
           t.longitude,
           t.status,
           t.created_at,
           t.updated_at,
           COUNT(m.id)::int AS message_count,
           COUNT(r.id)::int AS resolve_notifications_count
         FROM pollution_threads t
         LEFT JOIN pollution_messages m ON m.thread_id = t.id
         LEFT JOIN thread_resolve_notifications r ON r.thread_id = t.id
         WHERE t.id = $1
         GROUP BY t.id`,
        [threadId]
      );
      if (res.rows.length > 0) return res.rows[0];
    } catch (err) {
      console.warn('[localityDb] getThreadById DB error, using fallback:', err.message);
    }
  }

  const thread = memoryThreads.get(Number(threadId));
  if (!thread) return null;
  return {
    ...thread,
    message_count: getMemoryMessageCount(thread.id),
    resolve_notifications_count: getMemoryResolveCount(thread.id),
  };
}

async function createThread({ userId, username, title, description, latitude, longitude }) {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `INSERT INTO pollution_threads (user_id, username, title, description, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, username, title.trim(), description.trim(), latitude, longitude]
      );
      return { ...res.rows[0], message_count: 0, resolve_notifications_count: 0 };
    } catch (err) {
      console.warn('[localityDb] createThread DB error, saving to memory fallback:', err.message);
    }
  }

  const id = nextThreadId++;
  const thread = {
    id,
    user_id: userId,
    username,
    title: title.trim(),
    description: description.trim(),
    latitude,
    longitude,
    status: 'open',
    created_at: new Date(),
    updated_at: new Date(),
    message_count: 0,
    resolve_notifications_count: 0,
  };
  memoryThreads.set(id, thread);
  return thread;
}

async function deleteThread(threadId, userId) {
  const pool = getPool();
  if (pool) {
    try {
      // User must be the owner to delete/close
      const res = await pool.query(
        'DELETE FROM pollution_threads WHERE id = $1 AND user_id = $2 RETURNING id',
        [threadId, userId]
      );
      return res.rowCount > 0;
    } catch (err) {
      console.warn('[localityDb] deleteThread DB error, using fallback:', err.message);
    }
  }

  const thread = memoryThreads.get(Number(threadId));
  if (thread && thread.user_id === userId) {
    memoryThreads.delete(Number(threadId));
    // Cascade delete in-memory
    for (const [mId, m] of memoryMessages.entries()) {
      if (m.thread_id === Number(threadId)) memoryMessages.delete(mId);
    }
    for (const [rId, r] of memoryNotifications.entries()) {
      if (r.thread_id === Number(threadId)) memoryNotifications.delete(rId);
    }
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// User Threads & Resolve Notifications
// ---------------------------------------------------------------------------
async function getUserCreatedThreads(userId) {
  const pool = getPool();
  if (pool) {
    try {
      const threadsRes = await pool.query(
        `SELECT
           t.*,
           COUNT(m.id)::int AS message_count,
           COUNT(r.id)::int AS resolve_notifications_count
         FROM pollution_threads t
         LEFT JOIN pollution_messages m ON m.thread_id = t.id
         LEFT JOIN thread_resolve_notifications r ON r.thread_id = t.id
         WHERE t.user_id = $1
         GROUP BY t.id
         ORDER BY t.created_at DESC`,
        [userId]
      );

      const notifsRes = await pool.query(
        `SELECT * FROM thread_resolve_notifications WHERE creator_user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );

      const notifsByThread = {};
      notifsRes.rows.forEach((n) => {
        if (!notifsByThread[n.thread_id]) notifsByThread[n.thread_id] = [];
        notifsByThread[n.thread_id].push(n);
      });

      return threadsRes.rows.map((t) => ({
        ...t,
        notifications: notifsByThread[t.id] || [],
      }));
    } catch (err) {
      console.warn('[localityDb] getUserCreatedThreads DB error, using fallback:', err.message);
    }
  }

  const list = [];
  for (const t of memoryThreads.values()) {
    if (t.user_id === userId) {
      const notifs = [];
      for (const n of memoryNotifications.values()) {
        if (n.thread_id === t.id) notifs.push(n);
      }
      list.push({
        ...t,
        message_count: getMemoryMessageCount(t.id),
        resolve_notifications_count: notifs.length,
        notifications: notifs,
      });
    }
  }
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

async function notifyThreadResolved({ threadId, notifierUserId, notifierUsername, note }) {
  const thread = await getThreadById(threadId);
  if (!thread) throw new Error('Thread not found');
  if (thread.user_id === notifierUserId) {
    throw new Error('You cannot send a resolve notification to your own thread.');
  }

  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `INSERT INTO thread_resolve_notifications (thread_id, creator_user_id, notifier_user_id, notifier_username, note)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (thread_id, notifier_user_id) DO UPDATE SET
           note = EXCLUDED.note,
           created_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [threadId, thread.user_id, notifierUserId, notifierUsername, note || 'Issue observed to be resolved.']
      );
      return res.rows[0];
    } catch (err) {
      console.warn('[localityDb] notifyThreadResolved DB error, saving to memory fallback:', err.message);
    }
  }

  const id = nextNotificationId++;
  const notif = {
    id,
    thread_id: Number(threadId),
    creator_user_id: thread.user_id,
    notifier_user_id: notifierUserId,
    notifier_username: notifierUsername,
    note: note || 'Issue observed to be resolved.',
    created_at: new Date(),
  };
  memoryNotifications.set(id, notif);
  return notif;
}

// ---------------------------------------------------------------------------
// Thread Messages Operations
// ---------------------------------------------------------------------------
async function getThreadMessages(threadId) {
  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT id, thread_id, user_id, username, message, created_at
         FROM pollution_messages
         WHERE thread_id = $1
         ORDER BY created_at ASC`,
        [threadId]
      );
      return res.rows;
    } catch (err) {
      console.warn('[localityDb] getThreadMessages DB error, using fallback:', err.message);
    }
  }

  const list = [];
  for (const m of memoryMessages.values()) {
    if (m.thread_id === Number(threadId)) list.push(m);
  }
  return list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

async function createThreadMessage({ threadId, userId, username, message }) {
  if (!message || !message.trim()) throw new Error('Message cannot be empty');

  const pool = getPool();
  if (pool) {
    try {
      const res = await pool.query(
        `INSERT INTO pollution_messages (thread_id, user_id, username, message)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [threadId, userId, username, message.trim()]
      );
      return res.rows[0];
    } catch (err) {
      console.warn('[localityDb] createThreadMessage DB error, saving to memory fallback:', err.message);
    }
  }

  const id = nextMessageId++;
  const msg = {
    id,
    thread_id: Number(threadId),
    user_id: userId,
    username,
    message: message.trim(),
    created_at: new Date(),
  };
  memoryMessages.set(id, msg);
  return msg;
}

module.exports = {
  haversineDistanceKm,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  findUserByEmail,
  findUserByUsername,
  findUserByGoogleId,
  findUserById,
  createUser,
  getUserLocality,
  upsertUserLocality,
  getThreadsInLocality,
  getThreadById,
  createThread,
  deleteThread,
  getUserCreatedThreads,
  notifyThreadResolved,
  getThreadMessages,
  createThreadMessage,
};
