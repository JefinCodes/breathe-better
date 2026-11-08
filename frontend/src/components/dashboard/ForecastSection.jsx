import { RefreshCw } from 'lucide-react';
import ForecastCard from './ForecastCard';
import HealthAdvisory from './HealthAdvisory';

/**
 * Displays the full 96-hour forecast as a horizontal scrollable timeline,
 * followed by health recommendations from the first forecast hour (if available).
 *
 * Props:
 *   forecast  — array of hourly forecast objects | undefined
 *   isLoading — boolean
 *   isError   — boolean
 *   onRetry   — callback to refetch
 */
export default function ForecastSection({ forecast, isLoading, isError, onRetry }) {
  const sectionLabel = (
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
      {forecast?.length ? `${forecast.length}-Hour Forecast` : 'Forecast'}
    </h3>
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <section>
        {sectionLabel}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[72px] h-[90px] bg-gray-100 rounded-xl animate-pulse"
            />
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

  // Near-term health advisory from the first forecast hour
  const nearTermRecs = forecast[0]?.healthRecommendations ?? null;
  const hasRecs = nearTermRecs &&
    Object.values(nearTermRecs).some((v) => v && v.trim().length > 0);

  return (
    <section className="space-y-5">
      {/* Scrollable timeline */}
      <div>
        {sectionLabel}
        <div
          className="flex gap-2 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
        >
          {forecast.map((hour, i) => (
            <ForecastCard key={i} hour={hour} />
          ))}
        </div>
      </div>

      {/* Forecast health advisory */}
      {hasRecs && (
        <HealthAdvisory
          recommendations={nearTermRecs}
          title="Forecast Health Advisory"
        />
      )}
    </section>
  );
}
