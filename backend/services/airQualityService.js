'use strict';

const axios = require('axios');
const config = require('../config/airQuality');

/**
 * Axios instance pre-configured for every Google Air Quality API call.
 * The API key is attached as a query parameter on every request.
 * It is never placed in a header or logged at this level.
 */
const googleApi = axios.create({
  baseURL: config.baseUrl,
  timeout: config.timeout,
  params: { key: config.apiKey },
});

// ---------------------------------------------------------------------------
// Current conditions
// ---------------------------------------------------------------------------

/**
 * Fetches real-time air quality for the given coordinates.
 * Uses a single POST that returns all indexes and pollutant concentrations —
 * no separate per-pollutant requests are made.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<object>} Raw Google API response body.
 */
async function getCurrentConditions(latitude, longitude) {
  const response = await googleApi.post('/currentConditions:lookup', {
    location: { latitude, longitude },
    extraComputations: config.extraComputations.full,
    universalAqi: true,
    languageCode: 'en',
  });
  return response.data;
}

// ---------------------------------------------------------------------------
// Forecast
// ---------------------------------------------------------------------------

/**
 * Fetches hourly air quality forecast for up to 96 hours.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<object>} Raw Google API response body.
 */
async function getForecast(latitude, longitude) {
  const response = await googleApi.post('/forecast:lookup', {
    location: { latitude, longitude },
    hours: config.forecast.maxHours,
    extraComputations: config.extraComputations.full,
    universalAqi: true,
    languageCode: 'en',
  });
  return response.data;
}

// ---------------------------------------------------------------------------
// Historical data
// ---------------------------------------------------------------------------

/**
 * Fetches historical hourly air quality for the given time window.
 * Handles Google's pagination transparently — all pages are collected and
 * returned as a single merged hoursInfo array.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} startTime - ISO 8601 UTC string (e.g. "2024-01-01T00:00:00Z")
 * @param {string} endTime   - ISO 8601 UTC string
 * @returns {Promise<{ hoursInfo: Array }>}
 */
async function getHistory(latitude, longitude, startTime, endTime) {
  const allHours = [];
  let pageToken = undefined;

  do {
    const body = {
      location: { latitude, longitude },
      startTime,
      endTime,
      extraComputations: config.extraComputations.historical,
      universalAqi: true,
      languageCode: 'en',
      pageSize: config.history.pageSize,
    };

    if (pageToken) {
      body.pageToken = pageToken;
    }

    const response = await googleApi.post('/history:lookup', body);
    const data = response.data;

    if (Array.isArray(data.hoursInfo)) {
      allHours.push(...data.hoursInfo);
    }

    pageToken = data.nextPageToken || null;
  } while (pageToken);

  return { hoursInfo: allHours };
}

// ---------------------------------------------------------------------------
// Heatmap tile proxy
// ---------------------------------------------------------------------------

/**
 * Fetches a single 256×256 PNG heatmap tile from Google.
 * The binary response is returned as an ArrayBuffer so the controller can
 * stream it directly to the browser.
 *
 * @param {string} mapType - One of config.allowedMapTypes
 * @param {number} zoom    - Integer 0–16
 * @param {number} x       - Tile column index
 * @param {number} y       - Tile row index
 * @returns {Promise<{ data: ArrayBuffer, contentType: string }>}
 */
async function getHeatmapTile(mapType, zoom, x, y) {
  const response = await googleApi.get(
    `/mapTypes/${mapType}/heatmapTiles/${zoom}/${x}/${y}`,
    { responseType: 'arraybuffer' }
  );
  return {
    data: response.data,
    contentType: response.headers['content-type'] || 'image/png',
  };
}

module.exports = {
  getCurrentConditions,
  getForecast,
  getHistory,
  getHeatmapTile,
};
