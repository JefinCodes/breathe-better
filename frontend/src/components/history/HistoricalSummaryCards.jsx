import { Activity, ArrowUpRight, ArrowDownRight, Layers, AlertCircle, Info } from 'lucide-react';
import { getCpcbCategory, formatHistoryTimestampIST } from '../../lib/historyUtils';

/**
 * HistoricalSummaryCards
 *
 * Section 5: Summary statistics
 * - Average AQI
 * - Maximum AQI (with timestamp)
 * - Minimum AQI (with timestamp)
 * - Number of available observations
 * - Strictly excludes missing observations from calculations
 * - Handles empty observations gracefully
 * - Uses consistent AQI scale
 */
export default function HistoricalSummaryCards({ stats, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse space-y-3"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-200" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  const {
    totalObservations = 0,
    availableObservations = 0,
    missingObservations = 0,
    coveragePercent = 0,
    averageAqi = null,
    maxAqi = null,
    maxAqiTime = null,
    minAqi = null,
    minAqiTime = null,
    scaleName = 'CPCB NAQI (0–500)',
  } = stats || {};

  const hasData = availableObservations > 0;
  const avgCategory = hasData ? getCpcbCategory(averageAqi) : null;
  const maxCategory = hasData ? getCpcbCategory(maxAqi) : null;
  const minCategory = hasData ? getCpcbCategory(minAqi) : null;

  return (
    <div className="space-y-3">
      {/* Zero Observations Warning Banner */}
      {!hasData && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">No historical observations available</p>
            <p className="text-amber-700/90 mt-0.5">
              The Google Air Quality API returned 0 valid observations for this location and time interval.
              Try selecting a different date range or a different city.
            </p>
          </div>
        </div>
      )}

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Average AQI */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between space-y-3 hover:border-gray-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Average AQI
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {hasData && averageAqi != null ? averageAqi : '—'}
              </span>
              {hasData && avgCategory && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${avgCategory.bg} ${avgCategory.text} border ${avgCategory.border}`}
                >
                  {avgCategory.category}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Mean index over {availableObservations} valid hours
            </p>
          </div>

          <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400 flex items-center justify-between">
            <span>Scale: {scaleName}</span>
            <span>Non-missing only</span>
          </div>
        </div>

        {/* Card 2: Maximum AQI */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between space-y-3 hover:border-gray-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Maximum AQI (Peak)
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {hasData && maxAqi != null ? maxAqi : '—'}
              </span>
              {hasData && maxCategory && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${maxCategory.bg} ${maxCategory.text} border ${maxCategory.border}`}
                >
                  {maxCategory.category}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate" title={formatHistoryTimestampIST(maxAqiTime, 'full')}>
              {maxAqiTime ? `Peak: ${formatHistoryTimestampIST(maxAqiTime, 'short')}` : 'No peak recorded'}
            </p>
          </div>

          <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400">
            <span>Highest pollution concentration point</span>
          </div>
        </div>

        {/* Card 3: Minimum AQI */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between space-y-3 hover:border-gray-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Minimum AQI (Cleanest)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {hasData && minAqi != null ? minAqi : '—'}
              </span>
              {hasData && minCategory && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${minCategory.bg} ${minCategory.text} border ${minCategory.border}`}
                >
                  {minCategory.category}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate" title={formatHistoryTimestampIST(minAqiTime, 'full')}>
              {minAqiTime ? `Cleanest: ${formatHistoryTimestampIST(minAqiTime, 'short')}` : 'No trough recorded'}
            </p>
          </div>

          <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400">
            <span>Lowest pollution point in window</span>
          </div>
        </div>

        {/* Card 4: Available Observations */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between space-y-3 hover:border-gray-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Available Observations
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {availableObservations}
              </span>
              <span className="text-xs font-semibold text-gray-400">
                / {totalObservations} hrs
              </span>
              {hasData && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                  {coveragePercent}%
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {missingObservations > 0
                ? `${missingObservations} missing observation ${missingObservations === 1 ? 'hour' : 'hours'} excluded`
                : 'Complete observation dataset (0 missing)'}
            </p>
          </div>

          <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400 flex items-center gap-1">
            <Info className="w-3 h-3 text-gray-400" />
            <span>Missing hours uncounted in metrics</span>
          </div>
        </div>
      </div>
    </div>
  );
}
