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
 * Fetches hourly air quality forecast for the next 72 hours.
 *
 * Key API facts (confirmed by empirical testing):
 *   - The forecast:lookup endpoint uses a "period" object { startTime, endTime }
 *     NOT an "hours" field (which is a Weather API param and is rejected here).
 *   - The response array key is "hourlyForecasts" (not "hoursInfo").
 *   - "pageSize" controls records per page; pagination via nextPageToken.
 *   - startTime MUST be a UTC midnight boundary (00:00:00Z); requests starting
 *     at the current hour are rejected with INVALID_ARGUMENT.
 *   - The reliable max window from midnight is 72 h (3 days).
 *
 * All pages are merged transparently so the caller always gets a flat array.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{ hourlyForecasts: Array }>}
 */
async function getForecast(latitude, longitude) {
  // Google's forecast API requires startTime to be a UTC midnight boundary.
  // setUTCHours(24, 0, 0, 0) always advances to the next 00:00:00Z, which
  // gives today's midnight when called before midnight and tomorrow's midnight
  // when called after — always a valid, clean window start.
  const startTime = new Date();
  startTime.setUTCHours(24, 0, 0, 0);

  const endTime = new Date(startTime.getTime() + config.forecast.maxHours * 60 * 60 * 1000);

  const allHours = [];
  let pageToken = undefined;

  do {
    const body = {
      location: { latitude, longitude },
      period: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
      pageSize: config.forecast.pageSize,
      extraComputations: config.extraComputations.full,
      universalAqi: true,
      languageCode: 'en',
    };

    if (pageToken) {
      body.pageToken = pageToken;
    }

    const response = await googleApi.post('/forecast:lookup', body);
    const data = response.data;

    if (Array.isArray(data.hourlyForecasts)) {
      allHours.push(...data.hourlyForecasts);
    }

    pageToken = data.nextPageToken || null;
  } while (pageToken);

  return { hourlyForecasts: allHours };
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
      period: {
        startTime,
        endTime,
      },
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
