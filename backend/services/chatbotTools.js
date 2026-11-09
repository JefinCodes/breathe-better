'use strict';

const axios = require('axios');
const { getDb } = require('../db/database');
const airQualityService = require('./airQualityService');
const { heatmapCacheService } = require('./heatmapCacheService');
const chatbotDb = require('../db/chatbotDb');
const { getCategoryForAqi } = require('./cpcbKnowledge');

/**
 * Normalizes city query for SQLite search.
 */
function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Common city aliases in India.
 */
const CITY_ALIASES = {
  bombay: 'mumbai',
  madras: 'chennai',
  calcutta: 'kolkata',
  bangalore: 'bengaluru',
  gurgaon: 'gurugram',
  baroda: 'vadodara',
  trivandrum: 'thiruvananthapuram',
  cochin: 'kochi',
  banaras: 'varanasi',
  benares: 'varanasi',
  mysore: 'mysuru',
  pondicherry: 'puducherry',
};

/**
 * Tool 1: Resolves a city name to latitude and longitude.
 */
async function getLocationCoordinates({ query }) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return { found: false, error: 'Query parameter is required.' };
  }

  const rawQuery = query.trim();
  let normalized = normalizeName(rawQuery);
  if (CITY_ALIASES[normalized]) {
    normalized = CITY_ALIASES[normalized];
  }

  try {
    const db = getDb();

    // 1. Exact match on normalized_name
    let stmt = db.prepare(`
      SELECT name, state, latitude, longitude, population
      FROM cities
      WHERE normalized_name = ?
      ORDER BY population DESC NULLS LAST
      LIMIT 1
    `);
    let city = stmt.get(normalized);

    // 2. Prefix match if not found
    if (!city) {
      stmt = db.prepare(`
        SELECT name, state, latitude, longitude, population
        FROM cities
        WHERE normalized_name LIKE ?
        ORDER BY population DESC NULLS LAST
        LIMIT 1
      `);
      city = stmt.get(`${normalized}%`);
    }

    // 3. Substring match if still not found
    if (!city && normalized.length >= 3) {
      stmt = db.prepare(`
        SELECT name, state, latitude, longitude, population
        FROM cities
        WHERE normalized_name LIKE ?
        ORDER BY population DESC NULLS LAST
        LIMIT 1
      `);
      city = stmt.get(`%${normalized}%`);
    }

    if (city) {
      return {
        found: true,
        name: city.name,
        state: city.state,
        latitude: city.latitude,
        longitude: city.longitude,
        source: 'india_cities_database',
      };
    }
  } catch (err) {
    console.error('[chatbotTools/getLocationCoordinates] SQLite error:', err.message);
  }

  // Fallback to Google Geocoding API if Maps API key is configured
  if (process.env.GOOGLE_MAPS_API_KEY) {
    try {
      const geoRes = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: rawQuery,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
        timeout: 5000,
      });

      if (geoRes.data.status === 'OK' && geoRes.data.results?.length > 0) {
        const top = geoRes.data.results[0];
        const lat = top.geometry?.location?.lat;
        const lon = top.geometry?.location?.lng;
        return {
          found: true,
          name: top.formatted_address || rawQuery,
          state: '',
          latitude: lat,
          longitude: lon,
          source: 'google_geocoding',
        };
      }
    } catch (geoErr) {
      console.warn('[chatbotTools/getLocationCoordinates] Google Geocoding fallback error:', geoErr.message);
    }
  }

  return {
    found: false,
    query: rawQuery,
    message: `Could not find coordinates for "${rawQuery}". Please specify a recognized city or region.`,
  };
}

/**
 * Tool 2: Fetches real-time air quality for a location.
 */
async function getCurrentAirQuality({ latitude, longitude, cityName, conversationId }) {
  if (latitude == null || longitude == null) {
    return { error: 'Latitude and longitude are required.' };
  }

  try {
    const raw = await airQualityService.getCurrentConditions(latitude, longitude);

    const cpcbIndex = raw.indexes?.find((i) => i.code === 'ind_cpcb');
    const uaqiIndex = raw.indexes?.find((i) => i.code === 'uaqi');

    // Prefer CPCB AQI when in India, fallback to UAQI
    const activeIndex = cpcbIndex || uaqiIndex || raw.indexes?.[0];
    const aqiValue = activeIndex?.aqi ?? null;
    const categoryName = activeIndex?.category ?? 'Unknown';
    const dominantPollutant = activeIndex?.dominantPollutant ?? 'pm25';

    // Pollutant breakdown
    const pollutants = {};
    if (Array.isArray(raw.pollutants)) {
      raw.pollutants.forEach((p) => {
        if (p.code && p.concentration) {
          pollutants[p.code.toLowerCase()] = {
            value: p.concentration.value,
            units: p.concentration.units,
          };
        }
      });
    }

    // CPCB guideline matching
    const cpcbMeta = getCategoryForAqi(aqiValue);

    // Update conversation session
    if (conversationId && cityName) {
      await chatbotDb.upsertSession(conversationId, {
        lastCity: cityName,
        lastLatitude: latitude,
        lastLongitude: longitude,
      });
    }

    return {
      cityName: cityName || 'Selected Location',
      latitude,
      longitude,
      dateTime: raw.dateTime,
      primaryIndex: {
        code: activeIndex?.code,
        name: activeIndex?.displayName || 'AQI',
        aqi: aqiValue,
        category: categoryName,
        dominantPollutant,
      },
      cpcbStandard: cpcbMeta
        ? {
            officialCategory: cpcbMeta.category,
            healthImpact: cpcbMeta.impact,
            outdoorActivityGuidance: cpcbMeta.activityGuidance,
          }
        : null,
      pollutants,
      healthRecommendations: raw.healthRecommendations || null,
    };
  } catch (err) {
    console.error('[chatbotTools/getCurrentAirQuality] Error:', err.message);
    return {
      error: `Failed to fetch live air quality data: ${err.message}`,
    };
  }
}

/**
 * Tool 3: Fetches AQI forecast (tomorrow & upcoming days).
 */
async function getForecastAirQuality({ latitude, longitude, cityName, conversationId }) {
  if (latitude == null || longitude == null) {
    return { error: 'Latitude and longitude are required.' };
  }

  try {
    const raw = await airQualityService.getForecast(latitude, longitude);
    const hourly = Array.isArray(raw.hourlyForecasts) ? raw.hourlyForecasts : [];

    if (hourly.length === 0) {
      return { message: 'No forecast observations returned from Google Air Quality API.' };
    }

    // Group forecast hours by calendar day
    const dayBuckets = {};
    hourly.forEach((hour) => {
      const dateKey = hour.dateTime ? hour.dateTime.slice(0, 10) : 'unknown';
      if (!dayBuckets[dateKey]) {
        dayBuckets[dateKey] = [];
      }
      dayBuckets[dateKey].push(hour);
    });

    const daysSummary = Object.entries(dayBuckets).slice(0, 3).map(([date, hours], index) => {
      let aqiSum = 0;
      let minAqi = Infinity;
      let maxAqi = -Infinity;
      let validCount = 0;
      const dominantCounts = {};

      hours.forEach((h) => {
        const cpcb = h.indexes?.find((i) => i.code === 'ind_cpcb');
        const uaqi = h.indexes?.find((i) => i.code === 'uaqi');
        const idx = cpcb || uaqi || h.indexes?.[0];
        if (idx && idx.aqi != null) {
          const val = idx.aqi;
          aqiSum += val;
          if (val < minAqi) minAqi = val;
          if (val > maxAqi) maxAqi = val;
          validCount++;

          const dom = idx.dominantPollutant || 'unknown';
          dominantCounts[dom] = (dominantCounts[dom] || 0) + 1;
        }
      });

      const avgAqi = validCount > 0 ? Math.round(aqiSum / validCount) : null;
      const mostFrequentDominant = Object.entries(dominantCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'pm25';
      const cpcbMeta = getCategoryForAqi(avgAqi);

      const label = index === 0 ? 'Today / Remainder' : index === 1 ? 'Tomorrow' : 'Day After Tomorrow';

      return {
        label,
        date,
        averageAqi: avgAqi,
        minAqi: minAqi === Infinity ? null : minAqi,
        maxAqi: maxAqi === -Infinity ? null : maxAqi,
        expectedCategory: cpcbMeta?.category || 'Unknown',
        prominentPollutant: mostFrequentDominant,
        healthAdvisory: cpcbMeta?.activityGuidance || '',
      };
    });

    // Update conversation session
    if (conversationId && cityName) {
      await chatbotDb.upsertSession(conversationId, {
        lastCity: cityName,
        lastLatitude: latitude,
        lastLongitude: longitude,
      });
    }

    return {
      cityName: cityName || 'Selected Location',
      latitude,
      longitude,
      days: daysSummary,
      tomorrowSummary: daysSummary[1] || daysSummary[0],
    };
  } catch (err) {
    console.error('[chatbotTools/getForecastAirQuality] Error:', err.message);
    return { error: `Failed to fetch forecast: ${err.message}` };
  }
}

/**
 * Tool 4: Fetches historical air quality (up to 30 days supported by Google).
 */
async function getHistoricalAirQuality({ latitude, longitude, cityName, days = 30, conversationId }) {
  if (latitude == null || longitude == null) {
    return { error: 'Latitude and longitude are required.' };
  }

  // Google API allows at most 30 days and requires endDate to be in the past
  const MAX_GOOGLE_HISTORY_DAYS = 30;
  const requestedDays = parseInt(days, 10) || 30;
  const exceededApiLimit = requestedDays > MAX_GOOGLE_HISTORY_DAYS;

  // Set endDate to yesterday midnight UTC to ensure Google API accepts the historical query
  const now = new Date();
  const endUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 0, 0, 0));
  // 28 days back from yesterday covers the 1-month period safely within Google's 30-day boundary
  const queryDays = Math.min(requestedDays, 28);
  const startUtc = new Date(endUtc.getTime() - queryDays * 24 * 60 * 60 * 1000);

  try {
    const raw = await airQualityService.getHistory(
      latitude,
      longitude,
      startUtc.toISOString(),
      endUtc.toISOString()
    );

    const hours = Array.isArray(raw.hoursInfo) ? raw.hoursInfo : [];
    if (hours.length === 0) {
      return {
        cityName,
        message: 'No historical observations found for the specified period.',
        timeframeRequestedDays: requestedDays,
      };
    }

    let sumAqi = 0;
    let minAqi = Infinity;
    let maxAqi = -Infinity;
    let count = 0;
    const categoryCounts = {};
    const dominantCounts = {};

    hours.forEach((h) => {
      const cpcb = h.indexes?.find((i) => i.code === 'ind_cpcb');
      const uaqi = h.indexes?.find((i) => i.code === 'uaqi');
      const idx = cpcb || uaqi || h.indexes?.[0];
      if (idx && idx.aqi != null) {
        const val = idx.aqi;
        sumAqi += val;
        if (val < minAqi) minAqi = val;
        if (val > maxAqi) maxAqi = val;
        count++;

        const cat = idx.category || 'Unknown';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

        const dom = idx.dominantPollutant || 'unknown';
        dominantCounts[dom] = (dominantCounts[dom] || 0) + 1;
      }
    });

    const averageAqi = count > 0 ? Math.round(sumAqi / count) : null;
    const prominentPollutant = Object.entries(dominantCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'pm25';
    const cpcbMeta = getCategoryForAqi(averageAqi);

    // Update conversation session
    if (conversationId && cityName) {
      await chatbotDb.upsertSession(conversationId, {
        lastCity: cityName,
        lastLatitude: latitude,
        lastLongitude: longitude,
      });
    }

    return {
      cityName: cityName || 'Selected Location',
      timeframeDaysAnalyzed: queryDays,
      requestedDays,
      exceededApiLimit,
      apiLimitNotice: exceededApiLimit
        ? `Note: The Google Air Quality History API supports up to 30 days of historical records. Data shown covers the maximum available 30-day window.`
        : null,
      startDate: startUtc.toISOString().slice(0, 10),
      endDate: endUtc.toISOString().slice(0, 10),
      totalHourlyReadings: count,
      averageAqi,
      minAqi: minAqi === Infinity ? null : minAqi,
      maxAqi: maxAqi === -Infinity ? null : maxAqi,
      overallCategory: cpcbMeta?.category || 'Unknown',
      prominentPollutant,
      categoryDistribution: categoryCounts,
      healthInsight: cpcbMeta?.impact || 'Varied air quality conditions.',
    };
  } catch (err) {
    console.error('[chatbotTools/getHistoricalAirQuality] Error:', err.message);
    return {
      error: `Failed to fetch historical AQI data: ${err.message}`,
    };
  }
}

/**
 * Tool 5: Fetches heatmap metadata & supported layers.
 */
function getHeatmapInfo() {
  try {
    const meta = heatmapCacheService.getMetadata();
    return {
      success: true,
      supportedLayers: ['UAQI_RED_GREEN (Universal AQI)', 'PM25_INDIGO_PERSIAN (PM2.5 particles)'],
      lastUpdatedAtIST: meta.lastUpdatedIST || 'Updated hourly',
      nextUpdateAtIST: meta.nextUpdateIST || 'Next hour boundary',
      zoomLevels: '0 to 16',
      description: 'Satellite & ground sensor spatial pollution overlay updated on an hourly schedule.',
    };
  } catch (err) {
    return { error: 'Failed to retrieve heatmap info.' };
  }
}

/**
 * Tool definitions formatted for OpenAI / NVIDIA NIM tool-calling schema.
 */
const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_location_coordinates',
      description: 'Resolves a city or location name to latitude and longitude coordinates.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The city or location name, e.g. "Mumbai", "Delhi", "Chennai", "Bengaluru".',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_air_quality',
      description: 'Fetches real-time air quality index (AQI), pollutants (PM2.5, PM10, etc.), category, and health guidelines for given coordinates.',
      parameters: {
        type: 'object',
        properties: {
          latitude: { type: 'number', description: 'Latitude coordinate' },
          longitude: { type: 'number', description: 'Longitude coordinate' },
          cityName: { type: 'string', description: 'Name of the city/location' },
        },
        required: ['latitude', 'longitude'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_air_quality_forecast',
      description: 'Fetches hourly AQI forecast for tomorrow and the next 72 hours for given coordinates.',
      parameters: {
        type: 'object',
        properties: {
          latitude: { type: 'number', description: 'Latitude coordinate' },
          longitude: { type: 'number', description: 'Longitude coordinate' },
          cityName: { type: 'string', description: 'Name of the city/location' },
        },
        required: ['latitude', 'longitude'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_historical_air_quality',
      description: 'Fetches historical AQI observations and trends. NOTE: The upstream Google Air Quality API limit is maximum 30 days.',
      parameters: {
        type: 'object',
        properties: {
          latitude: { type: 'number', description: 'Latitude coordinate' },
          longitude: { type: 'number', description: 'Longitude coordinate' },
          cityName: { type: 'string', description: 'Name of the city/location' },
          days: {
            type: 'integer',
            description: 'Number of past days (e.g. 30 for 1 month, 60 for 2 months — maximum supported is 30).',
          },
        },
        required: ['latitude', 'longitude'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_heatmap_info',
      description: 'Fetches information and freshness metadata about the pollution heat map layers.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

/**
 * Tool dispatcher function.
 */
async function executeTool(name, args, conversationId) {
  switch (name) {
    case 'get_location_coordinates':
      return await getLocationCoordinates(args);
    case 'get_current_air_quality':
      return await getCurrentAirQuality({ ...args, conversationId });
    case 'get_air_quality_forecast':
      return await getForecastAirQuality({ ...args, conversationId });
    case 'get_historical_air_quality':
      return await getHistoricalAirQuality({ ...args, conversationId });
    case 'get_heatmap_info':
      return getHeatmapInfo();
    default:
      return { error: `Tool ${name} is not recognized.` };
  }
}

module.exports = {
  getLocationCoordinates,
  getCurrentAirQuality,
  getForecastAirQuality,
  getHistoricalAirQuality,
  getHeatmapInfo,
  TOOL_DEFINITIONS,
  executeTool,
};
