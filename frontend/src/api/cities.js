import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Search cities by prefix query.
 * @param {string} query - The search string.
 * @returns {Promise<Array>} Array of city objects.
 */
export async function searchCities(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }
  const response = await axios.get(`${API_BASE_URL}/api/cities/search`, {
    params: { q: query.trim() },
  });
  return response.data.results || [];
}
