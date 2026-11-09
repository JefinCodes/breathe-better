import { RefreshCw } from 'lucide-react';
import ForecastCard from './ForecastCard';

/**
 * Extracts a valid numeric AQI for an hourly forecast entry.
 * Prioritizes India CPCB AQI, then Universal AQI.
 */
function extractHourAqi(hour) {
  if (!hour) return null;
  if (Array.isArray(hour.aqi)) {
    const cpcb = hour.aqi.find((a) => a.code === 'ind_cpcb');
    if (cpcb && typeof cpcb.aqi === 'number') return cpcb.aqi;
    const uaqi = hour.aqi.find((a) => a.code === 'uaqi');
    if (uaqi && typeof uaqi.aqi === 'number') return uaqi.aqi;
    const any = hour.aqi.find((a) => typeof a.aqi === 'number');
    if (any) return any.aqi;
  } else if (typeof hour.aqi === 'number') {
    return hour.aqi;
  }
  return null;
}

/**
 * Computes rounded average AQI from a slice of hourly forecast entries.
 */
function computeAverageAqi(hours) {
  if (!hours || hours.length === 0) return null;
  const values = hours
    .map(extractHourAqi)
    .filter((v) => typeof v === 'number' && !isNaN(v));
  if (values.length === 0) return null;
  const total = values.reduce((sum, val) => sum + val, 0);
  return Math.round(total / values.length);
}

/**
 * Displays the 72-hour forecast aggregated into 3 periods of 24 hours each:
 * 1. 'Next 24 Hours'  (0 - 24 hours)
 * 2. '24 - 48 Hours'  (24 - 48 hours)
 * 3. '48 - 72 Hours'  (48 - 72 hours)
 *
 * If the forecast contains 73 hourly entries, the 73rd entry (index 72) is neglected.
 * The health advisory section for forecast has been removed per specification.
 *
 * Props:
 *   forecast  — array of hourly forecast objects
 *   isLoading — boolean
 *   isError   — boolean
 *   onRetry   — callback to refetch
 */
export default function ForecastSection({ forecast, isLoading, isError, onRetry }) {
  const sectionLabel = (
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
      72-Hour Forecast
    </h3>
  );

  // Loading skeleton (3 cards)
  if (isLoading) {
    return (
      <section>
        {sectionLabel}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-36 animate-pulse"
            >
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="w-12 h-12 bg-gray-100 rounded-full mb-3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (isError) {
    return (
      <section>
        {sectionLabel}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">Forecast data could not be loaded.</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      </section>
    );
  }

  // Empty state
  if (!forecast || forecast.length === 0) {
    return (
      <section>
        {sectionLabel}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-sm text-gray-400">No forecast data available.</p>
        </div>
      </section>
    );
  }

  // Neglect the 73rd value (or any beyond 72)
  const period1Aqi = computeAverageAqi(forecast.slice(0, 24));
  const period2Aqi = computeAverageAqi(forecast.slice(24, 48));
  const period3Aqi = computeAverageAqi(forecast.slice(48, 72));

  const periods = [
    {
      title: 'Next 24 Hours',
      aqi: period1Aqi,
      subtext: 'Average AQI • 0 - 24 hours',
    },
    {
      title: '24 - 48 Hours',
      aqi: period2Aqi,
      subtext: 'Average AQI • 24 - 48 hours',
    },
    {
      title: '48 - 72 Hours',
      aqi: period3Aqi,
      subtext: 'Average AQI • 48 - 72 hours',
    },
  ];

  return (
    <section>
      {sectionLabel}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {periods.map((period) => (
          <ForecastCard
            key={period.title}
            title={period.title}
            aqi={period.aqi}
            subtext={period.subtext}
          />
        ))}
      </div>
    </section>
  );
}
