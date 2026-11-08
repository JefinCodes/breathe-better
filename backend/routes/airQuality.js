'use strict';

const express = require('express');
const {
  getCurrent,
  getForecast,
  getHistory,
  getHeatmapTile,
} = require('../controllers/airQualityController');

const router = express.Router();

/**
 * GET /api/air-quality/current?latitude={lat}&longitude={lon}
 * Real-time air quality conditions (AQI indexes + pollutants + health recommendations).
 */
router.get('/current', getCurrent);

/**
 * GET /api/air-quality/forecast?latitude={lat}&longitude={lon}
 * Hourly forecast for the next 96 hours.
 */
router.get('/forecast', getForecast);

/**
 * GET /api/air-quality/history?latitude={lat}&longitude={lon}&startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}
 * Historical hourly observations. Date range ≤ 30 days, endDate must be in the past.
 */
router.get('/history', getHistory);

/**
 * GET /api/air-quality/heatmap?metric={mapType}&zoom={z}&x={x}&y={y}
 * Proxies a single 256×256 PNG heatmap tile from the Google Air Quality tile API.
 */
router.get('/heatmap', getHeatmapTile);

module.exports = router;
