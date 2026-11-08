import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Axios instance for all air-quality backend endpoints.
 * Timeout is generous (15 s) since Google API calls add upstream latency.
 */
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/air-quality`,
  timeout: 15_000,
});

/**
 * Fetch real-time air quality conditions for a coordinate.
 * @returns {Promise<{ success: boolean, data: object }>}
 */
export async function getCurrentConditions(latitude, longitude) {
  const { data } = await api.get('/current', { params: { latitude, longitude } });
  return data;
}

/**
 * Fetch the 96-hour AQI forecast for a coordinate.
 * @returns {Promise<{ success: boolean, data: object }>}
 */
export async function getForecast(latitude, longitude) {
  const { data } = await api.get('/forecast', { params: { latitude, longitude } });
  return data;
}

/**
 * Fetch historical air quality for a date range.
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate   - YYYY-MM-DD
 */
export async function getHistory(latitude, longitude, startDate, endDate) {
  const { data } = await api.get('/history', {
    params: { latitude, longitude, startDate, endDate },
  });
  return data;
}
