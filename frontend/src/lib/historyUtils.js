/**
 * Utilities, date validators, statistics calculators, and transformers
 * for Page 4: Historical Pollution Tracker.
 */

import { formatUnit } from './utils.js';

/**
 * Standard Indian AQI reference categories based on CPCB scale (0-500).
 */
export const CPCB_AQI_CATEGORIES = [
  { min: 0, max: 50, category: 'Good', color: '#10b981', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  { min: 51, max: 100, category: 'Satisfactory', color: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { min: 101, max: 200, category: 'Moderate', color: '#eab308', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  { min: 201, max: 300, category: 'Poor', color: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  { min: 301, max: 400, category: 'Very Poor', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  { min: 401, max: Infinity, category: 'Severe', color: '#991b1b', bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300' },
];

/**
 * Get category metadata for a given CPCB AQI value.
 */
export function getCpcbCategory(aqi) {
  if (aqi == null || isNaN(aqi)) {
    return { category: 'Unknown', color: '#9ca3af', bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200' };
  }
  for (const cat of CPCB_AQI_CATEGORIES) {
    if (aqi <= cat.max) return cat;
  }
  return CPCB_AQI_CATEGORIES[CPCB_AQI_CATEGORIES.length - 1];
}

/**
 * Prominent Indian cities pre-configured with verified SQLite database records.
 */
export const POPULAR_HISTORY_CITIES = [
  {
    geonameid: 1273294,
    name: 'Delhi',
    state: 'Delhi',
    latitude: 28.65195,
    longitude: 77.23149,
  },
  {
    geonameid: 1275339,
    name: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.07283,
    longitude: 72.88261,
  },
  {
    geonameid: 1277333,
    name: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.97194,
    longitude: 77.59369,
  },
  {
    geonameid: 1264527,
    name: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 13.08784,
    longitude: 80.27847,
  },
  {
    geonameid: 1275004,
    name: 'Kolkata',
    state: 'West Bengal',
    latitude: 22.56263,
    longitude: 88.36304,
  },
  {
    geonameid: 1269843,
    name: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.38405,
    longitude: 78.45636,
  },
];

export const DEFAULT_HISTORY_CITY = POPULAR_HISTORY_CITIES[0];

/**
 * Required pollutant metrics config.
 */
export const SUPPORTED_POLLUTANTS = [
  { code: 'pm25', name: 'PM2.5', label: 'PM2.5', formula: 'PM₂.₅', fullName: 'Fine particulate matter', color: '#dc2626', defaultUnit: 'µg/m³' },
  { code: 'pm10', name: 'PM10', label: 'PM10', formula: 'PM₁₀', fullName: 'Inhalable particulate matter', color: '#f97316', defaultUnit: 'µg/m³' },
  { code: 'no2', name: 'NO2', label: 'NO2', formula: 'NO₂', fullName: 'Nitrogen dioxide', color: '#7c3aed', defaultUnit: 'ppb' },
  { code: 'so2', name: 'SO2', label: 'SO2', formula: 'SO₂', fullName: 'Sulfur dioxide', color: '#0891b2', defaultUnit: 'ppb' },
  { code: 'co', name: 'CO', label: 'CO', formula: 'CO', fullName: 'Carbon monoxide', color: '#059669', defaultUnit: 'ppm' },
  { code: 'o3', name: 'O3', label: 'O3', formula: 'O₃', fullName: 'Ozone', color: '#2563eb', defaultUnit: 'ppb' },
];

/**
 * Calculates the maximum allowed end date string (YYYY-MM-DD) in IST.
 * Ensures that Date.parse(`${endDate}T00:00:00Z`) is <= Date.now()
 * to satisfy the backend `endMs > Date.now()` constraint.
 */
export function getMaxAllowedEndDate() {
  const now = new Date();
  const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
  const todayUtcMs = Date.parse(`${todayIST}T00:00:00Z`);

  if (todayUtcMs <= now.getTime()) {
    return todayIST;
  }
  // If midnight UTC for today's IST date is still in the future, return yesterday
  const yesterday = new Date(now.getTime() - 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(yesterday);
}

/**
 * Generates start and end date strings for historical queries.
 *
 * @param {number} days - 7, 14, 30 days
 * @returns {{ startDate: string, endDate: string }}
 */
export function getDefaultHistoricalRange(days = 7) {
  const maxEndStr = getMaxAllowedEndDate();
  const endMs = Date.parse(`${maxEndStr}T00:00:00Z`);
  const startMs = endMs - days * 86_400_000;
  const startDate = new Date(startMs).toISOString().split('T')[0];

  return {
    startDate,
    endDate: maxEndStr,
  };
}

/**
 * Validates the date interval according to Google API and backend constraints:
 * - startDate and endDate must be YYYY-MM-DD
 * - startDate must be before endDate
 * - Date range cannot exceed 30 days
 * - endDate must not be in the future
 *
 * @param {string} startDate
 * @param {string} endDate
 * @returns {{ isValid: boolean, error: string|null, diffDays: number }}
 */
export function validateDateRange(startDate, endDate) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!startDate || !endDate || !dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return { isValid: false, error: 'Start and end dates are required in YYYY-MM-DD format.', diffDays: 0 };
  }

  const startMs = Date.parse(`${startDate}T00:00:00Z`);
  const endMs = Date.parse(`${endDate}T00:00:00Z`);

  if (isNaN(startMs) || isNaN(endMs)) {
    return { isValid: false, error: 'Invalid calendar date values provided.', diffDays: 0 };
  }

  if (startMs >= endMs) {
    return { isValid: false, error: 'Start date must be strictly before end date.', diffDays: 0 };
  }

  const diffDays = Math.round((endMs - startMs) / 86_400_000);
  if (diffDays > 30) {
    return { isValid: false, error: 'Date range cannot exceed 30 days (Google API maximum limit).', diffDays };
  }

  if (endMs > Date.now()) {
    return { isValid: false, error: 'End date must be in the past for historical air quality observations.', diffDays };
  }

  return { isValid: true, error: null, diffDays };
}

/**
 * Format IST timestamps for axis ticks, tooltips, and badges.
 *
 * @param {string} istString
 * @param {'short'|'dateOnly'|'timeOnly'|'full'} format
 * @returns {string}
 */
export function formatHistoryTimestampIST(istString, format = 'full') {
  if (!istString) return '—';
  try {
    const d = new Date(istString);
    if (isNaN(d.getTime())) return istString;

    if (format === 'dateOnly') {
      return d.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
      });
    }

    if (format === 'timeOnly') {
      return d.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    if (format === 'short') {
      return d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    // 'full'
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return istString;
  }
}

/**
 * Processes and maps the raw backend historical observations response:
 * 1. Sorts observations chronologically (oldest to newest)
 * 2. Maps primary AQI (prioritising ind_cpcb 0-500, fallback uaqi)
 * 3. Maps all pollutants with concentration values and standardized units
 * 4. Identifies which pollutants are actually available (have at least 1 valid observation)
 * 5. Computes AQI summary statistics (Average, Maximum, Minimum, Available Count)
 *    strictly excluding missing observations.
 *
 * @param {Array} rawObservations
 * @returns {object} Processed data object
 */
export function processHistoricalObservations(rawObservations = []) {
  if (!Array.isArray(rawObservations) || rawObservations.length === 0) {
    return {
      observations: [],
      chartData: [],
      availablePollutants: [],
      stats: {
        totalObservations: 0,
        availableObservations: 0,
        missingObservations: 0,
        coveragePercent: 0,
        averageAqi: null,
        maxAqi: null,
        maxAqiTime: null,
        minAqi: null,
        minAqiTime: null,
        scaleName: 'CPCB NAQI (0–500)',
      },
      pollutantStats: {},
    };
  }

  // 1. Sort chronologically (oldest to newest for proper left-to-right charts)
  const sorted = [...rawObservations].sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeA - timeB;
  });

  // Track pollutants presence across all hours
  const pollutantPresence = new Map();
  SUPPORTED_POLLUTANTS.forEach((p) => {
    pollutantPresence.set(p.code.toLowerCase(), {
      count: 0,
      units: p.defaultUnit,
      displayName: p.name,
      fullName: p.fullName,
      values: [],
    });
  });

  // 2. Map observations
  let validAqiCount = 0;
  let aqiSum = 0;
  let maxAqi = -Infinity;
  let maxAqiTime = null;
  let minAqi = Infinity;
  let minAqiTime = null;
  let activeScaleName = 'CPCB NAQI (0–500)';

  const chartData = sorted.map((obs) => {
    const ts = obs.timestamp;

    // Resolve primary AQI: CPCB first, then UAQI
    const cpcb = obs.aqi?.find((a) => a.code === 'ind_cpcb');
    const uaqi = obs.aqi?.find((a) => a.code === 'uaqi');
    const primaryAqi = cpcb || uaqi || obs.aqi?.[0];

    const hasAqi = primaryAqi?.aqi != null && !isNaN(primaryAqi.aqi);
    const aqiVal = hasAqi ? primaryAqi.aqi : null;

    if (cpcb) {
      activeScaleName = 'CPCB NAQI (0–500)';
    } else if (uaqi && !cpcb) {
      activeScaleName = 'Universal AQI (0–100)';
    }

    if (hasAqi) {
      validAqiCount++;
      aqiSum += aqiVal;
      if (aqiVal > maxAqi) {
        maxAqi = aqiVal;
        maxAqiTime = ts;
      }
      if (aqiVal < minAqi) {
        minAqi = aqiVal;
        minAqiTime = ts;
      }
    }

    // Map pollutants
    const point = {
      timestamp: ts,
      formattedTime: formatHistoryTimestampIST(ts, 'short'),
      fullTime: formatHistoryTimestampIST(ts, 'full'),
      dateLabel: formatHistoryTimestampIST(ts, 'dateOnly'),
      timeLabel: formatHistoryTimestampIST(ts, 'timeOnly'),
      aqi: aqiVal, // Explicit null if missing; connectNulls={false} prevents fabrication
      category: primaryAqi?.category ?? (hasAqi ? getCpcbCategory(aqiVal).category : 'No data'),
      dominantPollutant: primaryAqi?.dominantPollutant ?? null,
      isMissingAqi: !hasAqi,
    };

    if (Array.isArray(obs.pollutants)) {
      obs.pollutants.forEach((p) => {
        const code = (p.code || '').toLowerCase();
        const val = p.concentration?.value;
        const rawUnit = p.concentration?.units;

        if (code && val != null && !isNaN(val)) {
          point[code] = val;
          const tracker = pollutantPresence.get(code);
          if (tracker) {
            tracker.count++;
            tracker.values.push(val);
            if (rawUnit) {
              tracker.units = formatUnit(rawUnit);
            }
          }
        } else if (code) {
          point[code] = null;
        }
      });
    }

    return point;
  });

  // 3. Filter available pollutants (only pollutants with valid observation data)
  const availablePollutants = SUPPORTED_POLLUTANTS.filter((p) => {
    const tracker = pollutantPresence.get(p.code.toLowerCase());
    return tracker && tracker.count > 0;
  }).map((p) => {
    const tracker = pollutantPresence.get(p.code.toLowerCase());
    return {
      ...p,
      unit: tracker?.units || p.defaultUnit,
      observationCount: tracker?.count || 0,
    };
  });

  // 4. Compute pollutant statistics
  const pollutantStats = {};
  availablePollutants.forEach((p) => {
    const tracker = pollutantPresence.get(p.code.toLowerCase());
    if (tracker && tracker.values.length > 0) {
      const sum = tracker.values.reduce((acc, v) => acc + v, 0);
      const max = Math.max(...tracker.values);
      const min = Math.min(...tracker.values);
      pollutantStats[p.code.toLowerCase()] = {
        average: Math.round((sum / tracker.values.length) * 100) / 100,
        max: Math.round(max * 100) / 100,
        min: Math.round(min * 100) / 100,
        count: tracker.count,
        unit: tracker.units,
      };
    }
  });

  // 5. Compute summary statistics
  const totalCount = sorted.length;
  const missingCount = totalCount - validAqiCount;
  const coveragePercent = totalCount > 0 ? Math.round((validAqiCount / totalCount) * 1000) / 10 : 0;
  const averageAqi = validAqiCount > 0 ? Math.round((aqiSum / validAqiCount) * 10) / 10 : null;

  return {
    observations: sorted,
    chartData,
    availablePollutants,
    stats: {
      totalObservations: totalCount,
      availableObservations: validAqiCount,
      missingObservations: missingCount,
      coveragePercent,
      averageAqi,
      maxAqi: validAqiCount > 0 ? maxAqi : null,
      maxAqiTime,
      minAqi: validAqiCount > 0 ? minAqi : null,
      minAqiTime,
      scaleName: activeScaleName,
    },
    pollutantStats,
  };
}
