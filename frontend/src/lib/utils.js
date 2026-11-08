import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes safely, deduplicating conflicting utilities.
 * Drop-in replacement for shadcn's cn() helper.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// City name formatting
// ---------------------------------------------------------------------------

/** First character uppercase, remainder lowercase. */
export function formatCityName(name) {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// ---------------------------------------------------------------------------
// AQI colour mapping
// ---------------------------------------------------------------------------

/**
 * Returns Tailwind colour classes appropriate for the given AQI value and
 * index code. CPCB (Indian AQI, 0-500) and UAQI (0-100) use different scales.
 *
 * Returns: { bg, text, ring, dot }
 */
export function getAqiColors(code, value) {
  if (value == null) {
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-500',
      ring: 'ring-gray-300',
      dot: 'bg-gray-400',
      border: 'border-gray-200',
    };
  }

  // India CPCB AQI — 0-500 scale
  if (code === 'ind_cpcb') {
    if (value <= 50)
      return { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-400', dot: 'bg-green-500', border: 'border-green-100' };
    if (value <= 100)
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-100' };
    if (value <= 200)
      return { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-400', dot: 'bg-yellow-500', border: 'border-yellow-100' };
    if (value <= 300)
      return { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-400', dot: 'bg-orange-500', border: 'border-orange-100' };
    if (value <= 400)
      return { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-400', dot: 'bg-red-500', border: 'border-red-100' };
    return { bg: 'bg-rose-100', text: 'text-rose-900', ring: 'ring-rose-500', dot: 'bg-rose-700', border: 'border-rose-200' };
  }

  // Universal AQI — 0-100 scale
  if (value <= 25)
    return { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-400', dot: 'bg-green-500', border: 'border-green-100' };
  if (value <= 50)
    return { bg: 'bg-lime-50', text: 'text-lime-700', ring: 'ring-lime-400', dot: 'bg-lime-500', border: 'border-lime-100' };
  if (value <= 75)
    return { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-400', dot: 'bg-amber-500', border: 'border-amber-100' };
  return { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-400', dot: 'bg-red-500', border: 'border-red-100' };
}

// ---------------------------------------------------------------------------
// Unit formatting
// ---------------------------------------------------------------------------

/** Converts Google API unit strings to human-readable symbols. */
export function formatUnit(units) {
  if (!units) return '';
  if (units === 'MICROGRAMS_PER_CUBIC_METER') return 'μg/m³';
  if (units === 'PARTS_PER_BILLION') return 'ppb';
  if (units === 'PARTS_PER_MILLION') return 'ppm';
  return units;
}

// ---------------------------------------------------------------------------
// Timestamp formatting
// ---------------------------------------------------------------------------

/**
 * Formats an IST timestamp string ("+05:30" offset) for display.
 * JavaScript correctly parses the offset, so no manual arithmetic is needed.
 *
 * Example output: "9 Nov, 8:30 AM"
 */
export function formatISTTimestamp(istString) {
  if (!istString) return '—';
  try {
    const date = new Date(istString);
    return date.toLocaleString('en-IN', {
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

/**
 * Compact format for forecast cards.
 * Example output: { day: "Mon", time: "2 PM" }
 */
export function formatForecastHour(istString) {
  if (!istString) return { day: '—', time: '—' };
  try {
    const date = new Date(istString);
    const day = date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' });
    const time = date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: true });
    return { day, time };
  } catch {
    return { day: '—', time: '—' };
  }
}

// ---------------------------------------------------------------------------
// Data freshness
// ---------------------------------------------------------------------------

/**
 * Returns a freshness label and colour class based on how old the observation is.
 * Air quality data updates hourly, so <90 min is considered live.
 */
export function getDataFreshness(istString) {
  if (!istString) return { label: 'Unknown', textColor: 'text-gray-500', badgeCls: 'bg-gray-100 text-gray-500' };
  const diffMin = Math.floor((Date.now() - new Date(istString).getTime()) / 60_000);
  if (diffMin < 90)
    return { label: 'Live', textColor: 'text-green-600', badgeCls: 'bg-green-50 text-green-700' };
  if (diffMin < 240)
    return {
      label: `${Math.floor(diffMin / 60)}h ago`,
      textColor: 'text-amber-600',
      badgeCls: 'bg-amber-50 text-amber-700',
    };
  return {
    label: `${Math.floor(diffMin / 60)}h ago`,
    textColor: 'text-red-600',
    badgeCls: 'bg-red-50 text-red-700',
  };
}
