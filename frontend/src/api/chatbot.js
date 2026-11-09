import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/chatbot`,
  timeout: 35000, // Generous timeout for tool executions + LLM synthesis
});

/**
 * Sends a chat message to the backend chatbot.
 * @param {object} params
 * @param {string} params.conversationId - Unique session ID
 * @param {string} params.message - User prompt text
 * @param {object} [params.userLocation] - Optional { latitude, longitude, city }
 * @returns {Promise<{ success: boolean, reply: string, lastCity: string|null, toolsUsed: string[], source: string }>}
 */
export async function sendChatMessage({ conversationId, message, userLocation }) {
  const { data } = await api.post('/message', {
    conversationId,
    message,
    userLocation,
  });
  return data;
}

/**
 * Retrieves the session information and recent messages.
 * @param {string} conversationId
 */
export async function getChatSession(conversationId) {
  const { data } = await api.get(`/session/${conversationId}`);
  return data;
}

/**
 * Clears the session and message history.
 * @param {string} conversationId
 */
export async function clearChatSession(conversationId) {
  const { data } = await api.delete(`/session/${conversationId}`);
  return data;
}
