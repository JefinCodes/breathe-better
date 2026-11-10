import { Loader2, AlertCircle, X } from 'lucide-react';
import { cn, formatCityName, getAqiColors, formatISTTimestamp, getDataFreshness } from '../../lib/utils';
import { getCityColor } from '../../lib/comparisonUtils';

/**
 * Section A: Summary Card
 *
 * Provides a responsive grid overview of the selected cities and their current AQI values.
 */
export default function ComparisonSummaryCards({
  selectedCities,
  currentQueries,
  onRemoveCity,
}) {
  if (selectedCities.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            A. Real-Time AQI Overview
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Current air quality index values and dominant pollutants for selected cities.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
          {selectedCities.length} {selectedCities.length === 1 ? 'City' : 'Cities'} Monitored
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedCities.map((city, index) => {
          const query = currentQueries[index];
          const color = getCityColor(index);
          const data = query?.data?.data;
          const isLoading = query?.isLoading;
          const isError = query?.isError;

          // Find India CPCB AQI as primary, with uaqi as fallback
          const cpcb = data?.aqi?.find((a) => a.code === 'ind_cpcb');
          const primaryAqi = cpcb || data?.aqi?.[0];
          const colors = primaryAqi
            ? getAqiColors(primaryAqi.code, primaryAqi.aqi)
            : getAqiColors(null, null);

          const freshness = getDataFreshness(data?.timestamp);

          return (
            <div
              key={city.geonameid || `${city.latitude}_${city.longitude}`}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-md"
            >
              {/* City Accent Top Border */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: color }}
              />

              {/* Header: Name, State & Remove Button */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate leading-tight">
                      {formatCityName(city.name)}
                    </h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {city.state}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveCity(city.geonameid)}
                  className="text-gray-400 hover:text-red-500 rounded-md p-1 hover:bg-red-50 transition-colors flex-shrink-0"
                  aria-label={`Remove ${city.name}`}
                  title="Remove from comparison"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Card Body */}
              {isLoading ? (
                <div className="py-8 flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                  <span className="text-xs font-medium">Loading conditions…</span>
                </div>
              ) : isError ? (
                <div className="py-6 px-3 bg-red-50/50 rounded-xl border border-red-100 text-center text-red-600">
                  <AlertCircle className="w-5 h-5 mx-auto mb-1 text-red-500" />
                  <p className="text-xs font-semibold">Failed to fetch data</p>
                  <button
                    type="button"
                    onClick={() => query.refetch()}
                    className="mt-2 text-[11px] font-medium text-red-700 underline hover:no-underline"
                  >
                    Try again
                  </button>
                </div>
              ) : primaryAqi ? (
                <div className="space-y-4">
                  {/* AQI Score Block */}
                  <div className="flex items-center gap-3.5 sm:gap-4">
                    <div
                      className={cn(
                        'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ring-2 flex flex-col items-center justify-center flex-shrink-0 shadow-inner',
                        colors.ring,
                        colors.bg
                      )}
                    >
                      <span className={cn('text-2xl sm:text-3xl font-black leading-none tracking-tight', colors.text)}>
                        {primaryAqi.aqi ?? '—'}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-medium text-gray-500 mt-0.5 sm:mt-1">
                        {primaryAqi.code === 'ind_cpcb' ? 'CPCB AQI' : primaryAqi.displayName || 'AQI'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span
                        className={cn(
                          'inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide mb-1',
                          colors.bg,
                          colors.text
                        )}
                      >
                        {primaryAqi.category ?? '—'}
                      </span>
                      {primaryAqi.dominantPollutant && (
                        <p className="text-xs text-gray-600">
                          Dominant:{' '}
                          <span className="font-semibold text-gray-900 uppercase">
                            {primaryAqi.dominantPollutant}
                          </span>
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1">
                        Scale: {primaryAqi.code === 'ind_cpcb' ? '0–500 (India)' : '0–100 (Universal)'}
                      </p>
                    </div>
                  </div>

                  {/* Footer Meta: Freshness and secondary AQI */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <span className={cn('w-1.5 h-1.5 rounded-full', freshness.textColor.replace('text-', 'bg-'))} />
                      {freshness.label} • {formatISTTimestamp(data.timestamp)}
                    </span>
                    {data.aqi?.length > 1 && (
                      <span className="text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                        {data.aqi.length} indexes
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-gray-400">
                  No AQI reported
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
