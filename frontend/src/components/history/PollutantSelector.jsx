import { Check } from 'lucide-react';

/**
 * PollutantSelector
 *
 * Section 4: Pollutant selector
 * - Allows switching between: PM2.5, PM10, NO2, SO2, CO, O3
 * - ONLY shows pollutants for which observations are available in the response
 * - Displays the appropriate concentration unit for each pollutant
 * - Switching pollutants happens entirely in local state (no extra API calls)
 */
export default function PollutantSelector({
  availablePollutants = [],
  selectedPollutant = 'pm25',
  onSelectPollutant,
  pollutantStats = {},
}) {
  if (availablePollutants.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-gray-50 text-gray-500 text-xs text-center border border-gray-100">
        No specific pollutant observations were reported for this interval.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Available Pollutants ({availablePollutants.length})
        </label>
        <span className="text-[11px] text-gray-400">
          Click to view historical concentration trend
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {availablePollutants.map((pollutant) => {
          const isSelected = selectedPollutant === pollutant.code.toLowerCase();
          const stats = pollutantStats[pollutant.code.toLowerCase()];

          return (
            <button
              key={pollutant.code}
              type="button"
              onClick={() => onSelectPollutant(pollutant.code.toLowerCase())}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white border-gray-200/80 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: pollutant.color }}
                />
                {isSelected && (
                  <span className="text-blue-600">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5 w-full">
                <span className="font-extrabold text-sm text-gray-900">
                  {pollutant.label}
                </span>
                <span className="text-[11px] text-gray-400 font-normal">
                  ({pollutant.formula})
                </span>
              </div>

              <div className="flex items-center justify-between w-full mt-1.5 text-[11px]">
                <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono font-medium">
                  {pollutant.unit}
                </span>
                {stats?.average != null && (
                  <span className="text-gray-500 font-medium">
                    avg {stats.average}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
