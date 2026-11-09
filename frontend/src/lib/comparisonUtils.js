/**
 * Utilities, presets, and constants for Page 3: Location Comparison.
 */

export const CITY_COLORS = [
  '#2563eb', // Indigo / Blue 600
  '#059669', // Emerald 600
  '#d97706', // Amber 600
  '#dc2626', // Red 600
  '#7c3aed', // Purple 600
  '#0891b2', // Cyan 600
  '#db2777', // Pink 600
  '#4b5563', // Gray 600
];

export function getCityColor(index) {
  return CITY_COLORS[index % CITY_COLORS.length];
}

/**
 * Prominent Indian cities pre-configured with their verified SQLite database records.
 */
export const POPULAR_CITIES = [
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

/**
 * Initial default selection: Delhi, Mumbai, Bengaluru for an immediate rich comparison.
 */
export const DEFAULT_SELECTED_CITIES = POPULAR_CITIES.slice(0, 3);

/**
 * Pollutant definitions matching the required metrics.
 */
export const COMPARISON_POLLUTANTS = [
  { code: 'pm25', name: 'PM2.5', label: 'PM2.5', fullName: 'Fine particulate matter', defaultUnit: 'µg/m³' },
  { code: 'pm10', name: 'PM10', label: 'PM10', fullName: 'Inhalable particulate matter', defaultUnit: 'µg/m³' },
  { code: 'no2', name: 'NO2', label: 'NO₂', fullName: 'Nitrogen dioxide', defaultUnit: 'ppb' },
  { code: 'so2', name: 'SO2', label: 'SO₂', fullName: 'Sulfur dioxide', defaultUnit: 'ppb' },
  { code: 'co', name: 'CO', label: 'CO', fullName: 'Carbon monoxide', defaultUnit: 'ppm' },
  { code: 'o3', name: 'o3', label: 'O₃', fullName: 'Ozone', defaultUnit: 'ppb' },
];

/**
 * Generate historical start/end date strings (YYYY-MM-DD in UTC) respecting Google API constraints:
 * - endDate is yesterday (UTC midnight in the past)
 * - date range <= 30 days
 */
export function getDefaultHistoricalRange(days = 7) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const endDate = end.toISOString().split('T')[0];

  const start = new Date(end.getTime());
  start.setUTCDate(start.getUTCDate() - days);
  const startDate = start.toISOString().split('T')[0];

  return { startDate, endDate };
}

/**
 * Format IST timestamps for historical axis and tooltips.
 */
export function formatHistoryTimestampIST(istString, format = 'short') {
  if (!istString) return '—';
  try {
    const d = new Date(istString);
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
        hour12: true,
      });
    }
    // Full IST label
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return istString;
  }
}
