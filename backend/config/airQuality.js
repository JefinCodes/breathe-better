'use strict';

/**
 * Centralised configuration for the Google Air Quality API.
 * All service and controller files import from here — never hardcode
 * API URLs, limits or key access elsewhere in the codebase.
 */
const config = {
  /** Google Air Quality REST API base URL (v1). */
  baseUrl: 'https://airquality.googleapis.com/v1',

  /**
   * API key is loaded from environment.
   * Never log or expose this value in responses.
   */
  get apiKey() {
    return process.env.GOOGLE_MAPS_API_KEY;
  },

  /** Axios request timeout in milliseconds. */
  timeout: 10_000,

  /**
   * Extra computations requested from Google.
   * "full" is used for current + forecast (includes health recommendations).
   * "historical" omits HEALTH_RECOMMENDATIONS to keep response sizes smaller.
   */
  extraComputations: {
    full: [
      'LOCAL_AQI',
      'POLLUTANT_CONCENTRATION',
      'DOMINANT_POLLUTANT_CONCENTRATION',
      'POLLUTANT_ADDITIONAL_INFO',
      'HEALTH_RECOMMENDATIONS',
    ],
    historical: [
      'LOCAL_AQI',
      'POLLUTANT_CONCENTRATION',
      'DOMINANT_POLLUTANT_CONCENTRATION',
    ],
  },

  forecast: {
    /**
     * Forecast window requested from the Google API.
     * Despite the docs mentioning 96 h, empirical testing shows the API
     * rejects periods that extend too far from the current time. 72 hours
     * (3 days) is the reliable maximum that consistently returns data.
     * pageSize controls records per page; set equal to maxHours so the
     * full window is returned in a single request when possible.
     */
    maxHours: 72,
    pageSize: 72,
  },

  history: {
    /** Maximum calendar days the Google History API supports. */
    maxDays: 30,
    /**
     * Records returned per page by the History API.
     * 720 = 30 days × 24 hours — covers the full allowed window in one page
     * whenever possible, minimising pagination round-trips.
     */
    pageSize: 720,
  },

  /**
   * Whitelist of valid mapType values accepted by the heatmap tile endpoint.
   * Any value not in this list is rejected with a 400 before hitting Google.
   */
  allowedMapTypes: [
    'UAQI_RED_GREEN',
    'UAQI_INDIGO_PERSIAN',
    'PM25_INDIGO_PERSIAN',
    'GBR_DEFRA',
    'DEU_UBA',
    'CAN_EC',
    'FRA_ATMO',
    'US_AQI',
  ],
};

module.exports = config;
