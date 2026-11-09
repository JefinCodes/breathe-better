'use strict';

const express = require('express');
const {
  handleMessage,
  getSession,
  clearSession,
} = require('../controllers/chatbotController');

const router = express.Router();

/**
 * POST /api/chatbot/message
 * Send a user query to the chatbot.
 */
router.post('/message', handleMessage);

/**
 * GET /api/chatbot/session/:conversationId
 * Retrieve session state and recent messages.
 */
router.get('/session/:conversationId', getSession);

/**
 * DELETE /api/chatbot/session/:conversationId
 * Reset/clear the active conversation session.
 */
router.delete('/session/:conversationId', clearSession);

module.exports = router;
