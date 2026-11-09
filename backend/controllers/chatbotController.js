'use strict';

const chatbotDb = require('../db/chatbotDb');
const nvidiaLlmService = require('../services/nvidiaLlmService');
const chatbotConfig = require('../config/chatbot');

/**
 * Controller: POST /api/chatbot/message
 * Handles an incoming user query within a conversation session.
 */
async function handleMessage(req, res) {
  const { conversationId, message, userLocation } = req.body;

  if (!conversationId || typeof conversationId !== 'string' || conversationId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'conversationId is required.' },
    });
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'message string is required.' },
    });
  }

  const cleanMessage = message.trim();
  const cleanConvId = conversationId.trim();

  try {
    // 1. Fetch current session and dialogue history for memory
    const session = await chatbotDb.getSession(cleanConvId);
    const recentMessages = await chatbotDb.getRecentMessages(
      cleanConvId,
      chatbotConfig.memoryWindow
    );

    // 2. Persist user's message
    await chatbotDb.saveMessage(cleanConvId, 'user', cleanMessage);

    // 3. Generate grounded LLM response using tools & CPCB text
    const llmResult = await nvidiaLlmService.generateNvidiaResponse({
      userMessage: cleanMessage,
      conversationId: cleanConvId,
      session,
      userLocation,
      recentMessages,
    });

    // 4. Persist assistant reply
    await chatbotDb.saveMessage(cleanConvId, 'assistant', llmResult.reply);

    // 5. Fetch updated session state (to return the latest discussed city)
    const updatedSession = await chatbotDb.getSession(cleanConvId);

    return res.json({
      success: true,
      conversationId: cleanConvId,
      reply: llmResult.reply,
      lastCity: updatedSession?.last_city || null,
      toolsUsed: llmResult.toolsUsed || [],
      source: llmResult.source || 'llm',
      warning: llmResult.warning || null,
    });
  } catch (err) {
    console.error('[chatbotController/handleMessage] Error:', err.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process your request. Please try again.',
      },
    });
  }
}

/**
 * Controller: GET /api/chatbot/session/:conversationId
 * Retrieves session state including last city discussed.
 */
async function getSession(req, res) {
  const { conversationId } = req.params;
  if (!conversationId) {
    return res.status(400).json({ success: false, error: 'conversationId is required.' });
  }

  try {
    const session = await chatbotDb.getSession(conversationId);
    const messages = await chatbotDb.getRecentMessages(conversationId, 20);

    return res.json({
      success: true,
      data: {
        session,
        messages,
      },
    });
  } catch (err) {
    console.error('[chatbotController/getSession] Error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve session.' });
  }
}

/**
 * Controller: DELETE /api/chatbot/session/:conversationId
 * Clears a session and its message memory.
 */
async function clearSession(req, res) {
  const { conversationId } = req.params;
  if (!conversationId) {
    return res.status(400).json({ success: false, error: 'conversationId is required.' });
  }

  try {
    await chatbotDb.clearSession(conversationId);
    return res.json({ success: true, message: 'Session cleared successfully.' });
  } catch (err) {
    console.error('[chatbotController/clearSession] Error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to clear session.' });
  }
}

module.exports = {
  handleMessage,
  getSession,
  clearSession,
};
