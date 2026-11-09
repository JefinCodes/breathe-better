'use strict';

/**
 * In-memory caching service for Google Air Quality Heatmap tiles.
 *
 * Requirements:
 * 1. Cache tiles for each supported metric.
 * 2. Cache validity follows the Google heat map's update time and the one-hour update interval.
 * 3. The cache remains valid until the previous heat map update time plus one hour.
 * 4. Reuse cached tiles for subsequent users and requests.
 * 5. Do not fetch tiles repeatedly while cached data is valid.
 * 6. Refresh the relevant metric's tiles when cache expires.
 * 7. Avoid duplicate simultaneous requests for the same expired cache (thundering herd prevention).
 * 8. Zero database/Redis dependencies — pure in-memory cache.
 */

const ONE_HOUR_MS = 60 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Converts a UTC Date/timestamp into an IST ISO-like string (+05:30).
 */
function toIST(utcDate) {
  const ms = utcDate instanceof Date ? utcDate.getTime() : typeof utcDate === 'number' ? utcDate : Date.parse(utcDate);
  if (isNaN(ms)) return null;
  return new Date(ms + IST_OFFSET_MS).toISOString().replace('Z', '+05:30');
}

/**
 * Calculates the current Google Air Quality update window.
 * Google Air Quality heat map tiles update hourly at the top of the hour (UTC).
 *
 * @param {number} now - Timestamp in ms (defaults to Date.now())
 * @returns {{ lastUpdateTimeMs: number, expiresAtMs: number, lastUpdateIso: string, lastUpdateIST: string, nextUpdateIso: string, nextUpdateIST: string }}
 */
function getCacheWindow(now = Date.now()) {
  const lastUpdateTimeMs = Math.floor(now / ONE_HOUR_MS) * ONE_HOUR_MS;
  const expiresAtMs = lastUpdateTimeMs + ONE_HOUR_MS;
  return {
    lastUpdateTimeMs,
    expiresAtMs,
    lastUpdateIso: new Date(lastUpdateTimeMs).toISOString(),
    lastUpdateIST: toIST(lastUpdateTimeMs),
    nextUpdateIso: new Date(expiresAtMs).toISOString(),
    nextUpdateIST: toIST(expiresAtMs),
  };
}

class HeatmapCacheService {
  constructor() {
    /**
     * In-memory storage for cached tiles.
     * key: `${metric}:${zoom}:${x}:${y}`
     * value: {
     *   data: Buffer,
     *   contentType: string,
     *   updatedAt: number,
     *   expiresAt: number,
     * }
     */
    this.cache = new Map();

    /**
     * Map of in-flight promises to prevent duplicate simultaneous upstream requests (thundering herd).
     * key: `${metric}:${zoom}:${x}:${y}`
     * value: Promise<CacheEntry>
     */
    this.inFlightRequests = new Map();
  }

  /**
   * Generates a unique cache key for a tile coordinate and metric.
   */
  getCacheKey(metric, zoom, x, y) {
    return `${metric}:${zoom}:${x}:${y}`;
  }

  /**
   * Retrieves a tile from in-memory cache or executes upstream fetch with deduplication.
   *
   * @param {string} metric   - Map type (e.g. 'UAQI_RED_GREEN' or 'PM25_INDIGO_PERSIAN')
   * @param {number} zoom     - Zoom level (integer)
   * @param {number} x        - Tile column
   * @param {number} y        - Tile row
   * @param {Function} fetcher - Async function (metric, zoom, x, y) => Promise<{ data, contentType }>
   * @returns {Promise<{ data: Buffer, contentType: string, updatedAt: number, expiresAt: number, isCacheHit: boolean }>}
   */
  async getOrFetchTile(metric, zoom, x, y, fetcher) {
    const key = this.getCacheKey(metric, zoom, x, y);
    const now = Date.now();

    // 1. Check in-memory cache
    const cachedEntry = this.cache.get(key);
    if (cachedEntry && now < cachedEntry.expiresAt) {
      return {
        data: cachedEntry.data,
        contentType: cachedEntry.contentType,
        updatedAt: cachedEntry.updatedAt,
        expiresAt: cachedEntry.expiresAt,
        isCacheHit: true,
      };
    }

    // 2. Check if a fetch is already in-flight for this exact tile (prevents duplicate simultaneous requests)
    if (this.inFlightRequests.has(key)) {
      const inFlightEntry = await this.inFlightRequests.get(key);
      return {
        ...inFlightEntry,
        isCacheHit: false,
        coalesced: true,
      };
    }

    // 3. Initiate single upstream request
    const fetchPromise = (async () => {
      try {
        const upstreamTile = await fetcher(metric, zoom, x, y);
        const { lastUpdateTimeMs, expiresAtMs } = getCacheWindow();
        const entry = {
          data: Buffer.from(upstreamTile.data),
          contentType: upstreamTile.contentType || 'image/png',
          updatedAt: lastUpdateTimeMs,
          expiresAt: expiresAtMs,
        };

        this.cache.set(key, entry);
        return entry;
      } finally {
        // Clean up in-flight promise once finished (success or failure)
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, fetchPromise);
    const entry = await fetchPromise;
    return {
      ...entry,
      isCacheHit: false,
      coalesced: false,
    };
  }

  /**
   * Returns current metadata about the heat map state and supported metrics.
   */
  getMetadata() {
    const window = getCacheWindow();
    return {
      lastUpdateTime: window.lastUpdateIST,
      lastUpdateTimeUtc: window.lastUpdateIso,
      nextUpdateTime: window.nextUpdateIST,
      nextUpdateTimeUtc: window.nextUpdateIso,
      updateIntervalMinutes: 60,
      cachedTilesCount: this.cache.size,
      supportedMetrics: [
        {
          id: 'UAQI_RED_GREEN',
          alias: 'aqi',
          displayName: 'Universal AQI',
          isUniversalAqi: true,
          description: 'Universal Air Quality Index (0-500 scale) calculated continuously by Google',
          palette: 'red_green',
        },
        {
          id: 'PM25_INDIGO_PERSIAN',
          alias: 'pm25',
          displayName: 'PM2.5',
          isUniversalAqi: false,
          description: 'Fine particulate matter (PM2.5) concentration overlay',
          palette: 'indigo_persian',
        },
      ],
    };
  }

  /**
   * Clears the in-memory cache (useful for testing or cache reset).
   */
  clear() {
    this.cache.clear();
    this.inFlightRequests.clear();
  }
}

const heatmapCacheService = new HeatmapCacheService();

module.exports = {
  heatmapCacheService,
  getCacheWindow,
  toIST,
};
