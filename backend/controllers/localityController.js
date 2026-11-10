'use strict';

const localityDb = require('../db/localityDb');

/**
 * Extracts and verifies auth token from Authorization header (Bearer <token>).
 */
function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  return localityDb.verifyToken(token);
}

/**
 * Middleware or helper to enforce authentication on protected endpoints.
 */
function requireAuth(req, res) {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ success: false, error: 'Authentication required. Please sign in.' });
    return null;
  }
  return user;
}

// ---------------------------------------------------------------------------
// Authentication Handlers
// ---------------------------------------------------------------------------

async function signup(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Username, email, and password are required.' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({ success: false, error: 'Username must be between 3 and 30 characters.' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ success: false, error: 'Username can only contain letters, numbers, and underscores.' });
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    const existingUser = await localityDb.findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const existingUsername = await localityDb.findUserByUsername(cleanUsername);
    if (existingUsername) {
      return res.status(409).json({ success: false, error: 'This username is already taken. Please pick another.' });
    }

    const user = await localityDb.createUser({
      username: cleanUsername,
      email: cleanEmail,
      password,
    });

    const token = localityDb.generateToken({ id: user.id, username: user.username, email: user.email });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        locality: null,
      },
    });
  } catch (err) {
    console.error('[locality/signup] Error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while creating account.' });
  }
}

async function login(req, res) {
  try {
    const { identifier, password } = req.body; // identifier can be email or username
    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Email/username and password are required.' });
    }

    const cleanId = identifier.trim();
    let user = null;
    if (cleanId.includes('@')) {
      user = await localityDb.findUserByEmail(cleanId);
    } else {
      user = await localityDb.findUserByUsername(cleanId);
    }

    if (!user || !user.password_hash) {
      return res.status(401).json({ success: false, error: 'Invalid email/username or password.' });
    }

    const valid = localityDb.verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email/username or password.' });
    }

    const locality = await localityDb.getUserLocality(user.id);
    const token = localityDb.generateToken({ id: user.id, username: user.username, email: user.email });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        locality,
      },
    });
  } catch (err) {
    console.error('[locality/login] Error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during login.' });
  }
}

/**
 * Parses Google ID Token payload if provided.
 */
function parseGoogleJwt(credential) {
  try {
    const parts = credential.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.given_name || 'User',
    };
  } catch {
    return null;
  }
}

async function googleAuth(req, res) {
  try {
    const { credential, googleId: directGoogleId, email: directEmail, name } = req.body;

    let googleId = directGoogleId;
    let email = directEmail;
    let displayName = name;

    if (credential) {
      const parsed = parseGoogleJwt(credential);
      if (parsed) {
        googleId = parsed.googleId;
        email = parsed.email;
        displayName = parsed.name;
      }
    }

    if (!googleId || !email) {
      return res.status(400).json({ success: false, error: 'Invalid Google authentication payload.' });
    }

    // 1. Check if user already exists by googleId
    let user = await localityDb.findUserByGoogleId(googleId);

    // 2. Or check by email
    if (!user) {
      user = await localityDb.findUserByEmail(email);
    }

    // If user exists, log in immediately
    if (user) {
      const locality = await localityDb.getUserLocality(user.id);
      const token = localityDb.generateToken({ id: user.id, username: user.username, email: user.email });
      return res.json({
        success: true,
        needsUsername: false,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          locality,
        },
      });
    }

    // If new user, prompt for username
    const suggestedUsername = (displayName || email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .substring(0, 20) || 'user';

    return res.json({
      success: true,
      needsUsername: true,
      googleId,
      email,
      suggestedUsername,
    });
  } catch (err) {
    console.error('[locality/googleAuth] Error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during Google auth.' });
  }
}

async function googleComplete(req, res) {
  try {
    const { googleId, email, username } = req.body;
    if (!googleId || !email || !username) {
      return res.status(400).json({ success: false, error: 'Google ID, email, and username are required.' });
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({ success: false, error: 'Username must be between 3 and 30 characters.' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return res.status(400).json({ success: false, error: 'Username can only contain letters, numbers, and underscores.' });
    }

    const existingUsername = await localityDb.findUserByUsername(cleanUsername);
    if (existingUsername) {
      return res.status(409).json({ success: false, error: 'This username is already taken. Please choose another.' });
    }

    const existingEmail = await localityDb.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const user = await localityDb.createUser({
      username: cleanUsername,
      email,
      googleId,
    });

    const token = localityDb.generateToken({ id: user.id, username: user.username, email: user.email });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        locality: null,
      },
    });
  } catch (err) {
    console.error('[locality/googleComplete] Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to complete Google registration.' });
  }
}

async function getMe(req, res) {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const user = await localityDb.findUserById(auth.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const locality = await localityDb.getUserLocality(user.id);

    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        locality,
      },
    });
  } catch (err) {
    console.error('[locality/getMe] Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
  }
}

// ---------------------------------------------------------------------------
// Locality Setup Handlers
// ---------------------------------------------------------------------------

async function setupLocality(req, res) {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const { localityName, latitude, longitude, radiusKm } = req.body;
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radius = parseFloat(radiusKm) || 5.0;

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ success: false, error: 'Valid latitude (-90 to 90) and longitude (-180 to 180) are required.' });
    }

    const savedLocality = await localityDb.upsertUserLocality(auth.id, {
      localityName: localityName || 'My Locality',
      latitude: lat,
      longitude: lon,
      radiusKm: radius,
    });

    return res.json({
      success: true,
      locality: savedLocality,
    });
  } catch (err) {
    console.error('[locality/setupLocality] Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save locality preferences.' });
  }
}

// ---------------------------------------------------------------------------
// Pollution Threads Handlers
// ---------------------------------------------------------------------------

async function getThreads(req, res) {
  try {
    let lat = parseFloat(req.query.latitude);
    let lon = parseFloat(req.query.longitude);
    let radius = parseFloat(req.query.radiusKm) || 50.0;

    // If coordinates are not provided, check if user is authenticated and has a saved locality
    const auth = getAuthUser(req);
    if ((isNaN(lat) || isNaN(lon)) && auth) {
      const loc = await localityDb.getUserLocality(auth.id);
      if (loc) {
        lat = loc.latitude;
        lon = loc.longitude;
        radius = loc.radius_km || 50.0;
      }
    }

    if (isNaN(lat) || isNaN(lon)) {
      // Default to India center if unspecified
      lat = 20.5937;
      lon = 78.9629;
      radius = 5000.0; // show all
    }

    const threads = await localityDb.getThreadsInLocality({
      latitude: lat,
      longitude: lon,
      radiusKm: radius,
    });

    return res.json({
      success: true,
      threads,
    });
  } catch (err) {
    console.error('[locality/getThreads] Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve locality pollution threads.' });
  }
}

async function createThread(req, res) {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const { title, description, latitude, longitude } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Title and description are required.' });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ success: false, error: 'Valid latitude and longitude are required.' });
    }

    const thread = await localityDb.createThread({
      userId: auth.id,
      username: auth.username,
      title,
      description,
      latitude: lat,
      longitude: lon,
    });

    return res.status(201).json({
      success: true,
      thread,
    });
  } catch (err) {
    console.error('[locality/createThread] Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to report pollution thread.' });
  }
}

async function deleteThread(req, res) {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const threadId = parseInt(req.params.id, 10);
    if (isNaN(threadId)) {
      return res.status(400).json({ success: false, error: 'Invalid thread ID.' });
    }

    const deleted = await localityDb.deleteThread(threadId, auth.id);
    if (!deleted) {
      return res.status(403).json({ success: false, error: 'You can only delete/close threads you created.' });
    }

    return res.json({
      success: true,
      message: 'Thread successfully resolved and closed.',
    });
  } catch (err) {
    console.error('[locality/deleteThread] Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete thread.' });
  }
}

async function getMyThreads(req, res) {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const threads = await localityDb.getUserCreatedThreads(auth.id);
    return res.json({
      success: true,
      threads,
    });
  } catch (err) {
    console.error('[locality/getMyThreads] Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve your threads.' });
  }
}

async function notifyResolved(req, res) {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const threadId = parseInt(req.params.id, 10);
    if (isNaN(threadId)) {
      return res.status(400).json({ success: false, error: 'Invalid thread ID.' });
    }

    const { note } = req.body;
    const notif = await localityDb.notifyThreadResolved({
      threadId,
      notifierUserId: auth.id,
      notifierUsername: auth.username,
      note,
    });

    return res.json({
      success: true,
      message: 'Thread creator notified that the issue is resolved.',
      notification: notif,
    });
  } catch (err) {
    console.error('[locality/notifyResolved] Error:', err.message);
    return res.status(400).json({ success: false, error: err.message || 'Failed to send resolution notification.' });
  }
}

// ---------------------------------------------------------------------------
// Discussion Messages Handlers
// ---------------------------------------------------------------------------

async function getMessages(req, res) {
  try {
    const threadId = parseInt(req.params.id, 10);
    if (isNaN(threadId)) {
      return res.status(400).json({ success: false, error: 'Invalid thread ID.' });
    }

    const messages = await localityDb.getThreadMessages(threadId);
    return res.json({
      success: true,
      messages,
    });
  } catch (err) {
    console.error('[locality/getMessages] Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve messages.' });
  }
}

async function postMessage(req, res) {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const threadId = parseInt(req.params.id, 10);
    if (isNaN(threadId)) {
      return res.status(400).json({ success: false, error: 'Invalid thread ID.' });
    }

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message content is required.' });
    }

    const newMsg = await localityDb.createThreadMessage({
      threadId,
      userId: auth.id,
      username: auth.username,
      message,
    });

    return res.status(201).json({
      success: true,
      message: newMsg,
    });
  } catch (err) {
    console.error('[locality/postMessage] Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to post message.' });
  }
}

module.exports = {
  signup,
  login,
  googleAuth,
  googleComplete,
  getMe,
  setupLocality,
  getThreads,
  createThread,
  deleteThread,
  getMyThreads,
  notifyResolved,
  getMessages,
  postMessage,
};
