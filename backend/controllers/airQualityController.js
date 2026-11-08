'use strict';

const airQualityService = require('../services/airQualityService');
const config = require('../config/airQuality');

// ---------------------------------------------------------------------------
// IST conversion helpers
// ---------------------------------------------------------------------------

/** IST is UTC + 5 hours 30 minutes = 19 800 000 ms */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Converts a UTC ISO 8601 string to an IST-offset ISO 8601 string.
 * Returns null for falsy or unparseable input so callers never receive
 * undefined in a JSON response.
 *
 * @param {string|null|undefined} utcString
 * @returns {string|null}
 */
function toIST(utcString) {
  if (!utcString) return null;
  const ms = Date.parse(utcString);
  if (isNaN(ms)) return null;
  return new Date(ms + IST_OFFSET_MS).toISOString().replace('Z', '+05:30');
}

// ---------------------------------------------------------------------------
// Response-mapping helpers
// ---------------------------------------------------------------------------

/**
 * Maps the raw Google `indexes` array to the application-owned AQI structure.
 * Preserves the index code so callers can distinguish uaqi from ind_cpcb etc.
 *
 * @param {Array|undefined} indexes
 * @returns {Array}
 */
function mapIndexes(indexes) {
  if (!Array.isArray(indexes)) return [];
  return indexes.map((idx) => ({
    code: idx.code ?? null,
    displayName: idx.displayName ?? null,
    aqi: idx.aqi ?? null,
    aqiDisplay: idx.aqiDisplay ?? null,
    category: idx.category ?? null,
    dominantPollutant: idx.dominantPollutant ?? null,
    color: idx.color ?? null,
  }));
}

/**
 * Maps the raw Google `pollutants` array to the application-owned structure.
 * Preserves units exactly as returned by Google; never invents missing values.
 *
 * @param {Array|undefined} pollutants
 * @returns {Array}
 */
function mapPollutants(pollutants) {
  if (!Array.isArray(pollutants)) return [];
  return pollutants.map((p) => ({
    code: p.code ?? null,
    displayName: p.displayName ?? null,
    fullName: p.fullName ?? null,
    concentration: p.concentration
      ? {
          value: p.concentration.value ?? null,
          units: p.concentration.units ?? null,
        }
      : null,
    additionalInfo: p.additionalInfo ?? null,
  }));
}

/**
 * Maps Google's healthRecommendations object to the app structure.
 * All seven population groups are enumerated explicitly; missing ones are null.
 *
 * @param {object|null|undefined} rec
 * @returns {object|null}
 */
function mapHealthRecommendations(rec) {
  if (!rec || typeof rec !== 'object') return null;
  return {
    generalPopulation: rec.generalPopulation ?? null,
    elderly: rec.elderly ?? null,
    lungDiseasePopulation: rec.lungDiseasePopulation ?? null,
    heartDiseasePopulation: rec.heartDiseasePopulation ?? null,
    athletes: rec.athletes ?? null,
    pregnantWomen: rec.pregnantWomen ?? null,
    children: rec.children ?? null,
  };
}

// ---------------------------------------------------------------------------
// Error handler (shared by all JSON-response endpoints)
// ---------------------------------------------------------------------------

/**
 * Translates Axios / Google API errors into consistent app error responses.
 * API key is never included in logged messages.
 *
 * @param {Error} err
 * @param {object} res  - Express response
 * @param {string} ctx  - Label used in log output for traceability
 */
function handleGoogleError(err, res, ctx) {
  if (err.response) {
    const googleStatus = err.response.status;
    const message =
      err.response.data?.error?.message || 'Google API returned an error.';
    console.error(`[airQuality/${ctx}] Google API ${googleStatus}:`, message);
    // Map Google rate-limit → 429, Google server error → 502, else pass through
    const appStatus =
      googleStatus === 429 ? 429 : googleStatus >= 500 ? 502 : googleStatus;
    return res.status(appStatus).json({
      success: false,
      error: { code: 'GOOGLE_API_ERROR', message },
    });
  }
  if (err.code === 'ECONNABORTED') {
    console.error(`[airQuality/${ctx}] Request timed out`);
    return res.status(504).json({
      success: false,
      error: { code: 'TIMEOUT', message: 'Request to Google API timed out.' },
    });
  }
  console.error(`[airQuality/${ctx}] Unexpected error:`, err.message);
  return res.status(502).json({
    success: false,
    error: { code: 'UPSTREAM_ERROR', message: 'Failed to reach Google API.' },
  });
}

// ---------------------------------------------------------------------------
// Reusable coordinate validator
// ---------------------------------------------------------------------------

/**
 * Validates latitude and longitude query params.
 * Returns { lat, lon } on success or sends a 400 and returns null.
 */
function validateCoordinates(req, res) {
  const lat = parseFloat(req.query.latitude);
  const lon = parseFloat(req.query.longitude);

  if (
    isNaN(lat) || isNaN(lon) ||
    lat < -90 || lat > 90 ||
    lon < -180 || lon > 180
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message:
          'Valid latitude (-90 to 90) and longitude (-180 to 180) are required.',
      },
    });
    return null;
  }
  return { lat, lon };
}

// ---------------------------------------------------------------------------
// Controller: GET /api/air-quality/current
// ---------------------------------------------------------------------------

/**
 * Returns real-time air quality conditions for the given coordinates.
 * A single Google API call returns all indexes (uaqi, ind_cpcb, …) and
 * all pollutant concentrations — no per-pollutant requests are made.
 */
async function getCurrent(req, res) {
  const coords = validateCoordinates(req, res);
  if (!coords) return;
  const { lat, lon } = coords;

  try {
    const raw = await airQualityService.getCurrentConditions(lat, lon);
    return res.json({
      success: true,
      data: {
        location: { latitude: lat, longitude: lon },
        timestamp: toIST(raw.dateTime),
        aqi: mapIndexes(raw.indexes),
        pollutants: mapPollutants(raw.pollutants),
        healthRecommendations: mapHealthRecommendations(raw.healthRecommendations),
      },
    });
  } catch (err) {
    return handleGoogleError(err, res, 'getCurrent');
  }
}

// ---------------------------------------------------------------------------
// Controller: GET /api/air-quality/forecast
// ---------------------------------------------------------------------------

/**
 * Returns hourly air quality forecast for the next 96 hours.
 */
async function getForecast(req, res) {
  const coords = validateCoordinates(req, res);
  if (!coords) return;
  const { lat, lon } = coords;

  try {
    const raw = await airQualityService.getForecast(lat, lon);
    // Google's forecast:lookup response uses "hourlyForecasts" (not "hoursInfo")
    const hours = Array.isArray(raw.hourlyForecasts) ? raw.hourlyForecasts : [];

    return res.json({
      success: true,
      data: {
        location: { latitude: lat, longitude: lon },
        forecast: hours.map((h) => ({
          timestamp: toIST(h.dateTime),
          aqi: mapIndexes(h.indexes),
          pollutants: mapPollutants(h.pollutants),
          healthRecommendations: mapHealthRecommendations(h.healthRecommendations),
        })),
      },
    });
  } catch (err) {
    return handleGoogleError(err, res, 'getForecast');
  }
}

// ---------------------------------------------------------------------------
// Controller: GET /api/air-quality/history
// ---------------------------------------------------------------------------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns hourly historical air quality observations for a date range.
 * Dates are accepted as YYYY-MM-DD (treated as UTC midnight for consistency
 * across locations). Range is capped at 30 days (Google API limit).
 * Google pagination is handled transparently by the service layer.
 */
async function getHistory(req, res) {
  const coords = validateCoordinates(req, res);
  if (!coords) return;
  const { lat, lon } = coords;

  const { startDate, endDate } = req.query;

  if (!startDate || !endDate || !DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: 'startDate and endDate are required in YYYY-MM-DD format.',
      },
    });
  }

  const startMs = Date.parse(`${startDate}T00:00:00Z`);
  const endMs = Date.parse(`${endDate}T00:00:00Z`);

  if (isNaN(startMs) || isNaN(endMs)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PARAMS', message: 'Invalid date values.' },
    });
  }

  if (startMs >= endMs) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: 'startDate must be before endDate.',
      },
    });
  }

  const diffDays = (endMs - startMs) / 86_400_000;
  if (diffDays > config.history.maxDays) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: `Date range cannot exceed ${config.history.maxDays} days.`,
      },
    });
  }

  if (endMs > Date.now()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: 'endDate must be in the past for historical data.',
      },
    });
  }

  try {
    const raw = await airQualityService.getHistory(
      lat, lon,
      new Date(startMs).toISOString(),
      new Date(endMs).toISOString()
    );
    const hours = Array.isArray(raw.hoursInfo) ? raw.hoursInfo : [];

    return res.json({
      success: true,
      data: {
        location: { latitude: lat, longitude: lon },
        startDate,
        endDate,
        observations: hours.map((h) => ({
          timestamp: toIST(h.dateTime),
          aqi: mapIndexes(h.indexes),
          pollutants: mapPollutants(h.pollutants),
        })),
      },
    });
  } catch (err) {
    return handleGoogleError(err, res, 'getHistory');
  }
}

// ---------------------------------------------------------------------------
// Controller: GET /api/air-quality/heatmap
// ---------------------------------------------------------------------------

/**
 * Attempts to parse an error message from an ArrayBuffer response body.
 * Needed because heatmap tiles are fetched with responseType:'arraybuffer',
 * so even error responses arrive as binary data.
 */
function extractTileErrorMessage(data) {
  try {
    const text = Buffer.from(data).toString('utf8');
    return JSON.parse(text)?.error?.message || 'Google API error.';
  } catch {
    return 'Google API error.';
  }
}

/**
 * Proxies a single 256×256 PNG heatmap tile from Google to the browser.
 * The metric (mapType) is validated against a whitelist before the request
 * is forwarded — unknown types are rejected with a 400.
 *
 * The frontend loads all tiles needed to cover India's geographic extent at
 * the chosen zoom level by making individual requests to this endpoint, one
 * per tile coordinate.
 *
 * Cache-Control is set so browsers and CDNs can cache tiles for 1 hour,
 * reducing redundant Google API calls for the same tile position.
 */
async function getHeatmapTile(req, res) {
  const { metric, zoom, x, y } = req.query;

  if (!metric || !config.allowedMapTypes.includes(metric)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: `metric must be one of: ${config.allowedMapTypes.join(', ')}.`,
      },
    });
  }

  const z = parseInt(zoom, 10);
  const tileX = parseInt(x, 10);
  const tileY = parseInt(y, 10);

  if (
    isNaN(z) || isNaN(tileX) || isNaN(tileY) ||
    z < 0 || z > 16 ||
    tileX < 0 || tileY < 0
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: 'zoom (0–16), x and y must be non-negative integers.',
      },
    });
  }

  try {
    const tile = await airQualityService.getHeatmapTile(metric, z, tileX, tileY);
    res.set('Content-Type', tile.contentType);
    res.set('Cache-Control', 'public, max-age=3600');
    return res.send(Buffer.from(tile.data));
  } catch (err) {
    if (err.response) {
      const googleStatus = err.response.status;
      const message = extractTileErrorMessage(err.response.data);
      console.error(`[airQuality/getHeatmapTile] Google API ${googleStatus}:`, message);
      const appStatus = googleStatus >= 500 ? 502 : googleStatus;
      return res.status(appStatus).json({
        success: false,
        error: { code: 'GOOGLE_API_ERROR', message },
      });
    }
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        error: { code: 'TIMEOUT', message: 'Heatmap tile request timed out.' },
      });
    }
    console.error('[airQuality/getHeatmapTile] Unexpected error:', err.message);
    return res.status(502).json({
      success: false,
      error: { code: 'UPSTREAM_ERROR', message: 'Failed to fetch heatmap tile.' },
    });
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { getCurrent, getForecast, getHistory, getHeatmapTile };
