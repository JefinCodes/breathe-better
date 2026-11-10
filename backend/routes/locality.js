'use strict';

const express = require('express');
const {
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
} = require('../controllers/localityController');

const router = express.Router();

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------
router.post('/auth/signup', signup);
router.post('/auth/login', login);
router.post('/auth/google', googleAuth);
router.post('/auth/google/complete', googleComplete);
router.get('/auth/me', getMe);

// ---------------------------------------------------------------------------
// Locality preferences
// ---------------------------------------------------------------------------
router.post('/setup', setupLocality);

// ---------------------------------------------------------------------------
// Pollution Threads
// ---------------------------------------------------------------------------
router.get('/threads', getThreads);
router.post('/threads', createThread);
router.delete('/threads/:id', deleteThread);
router.post('/threads/:id/resolve-notify', notifyResolved);
router.get('/my-threads', getMyThreads);

// ---------------------------------------------------------------------------
// Discussion Messages
// ---------------------------------------------------------------------------
router.get('/threads/:id/messages', getMessages);
router.post('/threads/:id/messages', postMessage);

module.exports = router;
