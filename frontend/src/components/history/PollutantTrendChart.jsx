import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, AlertCircle, Info } from 'lucide-react';

/**
 * PollutantTrendChart
 *
 * Section 4: Pollutant trend chart
 * - Displays historical concentration curve of the selected pollutant
 * - Uses the single merged historical response (zero extra network calls)
 * - IST timestamps on X-axis and tooltips
 * - Concentration unit dynamically matched from response
 * - connectNulls={false} skips missing hours without interpolating
 */
export default function PollutantTrendChart({
  chartData = [],
  selectedPollutantConfig,
  pollutantStats = {},
  diffDays = 7,
}) {
  const pollutantKey = selectedPollutantConfig?.code?.toLowerCase() || 'pm25';
  const label = selectedPollutantConfig?.label || 'Pollutant';
  const fullName = selectedPollutantConfig?.fullName || '';
  const color = selectedPollutantConfig?.color || '#2563eb';
  const unit = selectedPollutantConfig?.unit || selectedPollutantConfig?.defaultUnit || 'µg/m³';

  const stats = pollutantStats[pollutantKey] || {};
  const hasData = chartData && chartData.length > 0;

  // Filter valid data points for this pollutant
  const validPoints = hasData ? chartData.filter((d) => d[pollutantKey] != null).length : 0;

  const tickInterval = hasData
    ? Math.max(1, Math.floor(chartData.length / (diffDays <= 7 ? 7 : diffDays <= 14 ? 7 : 8)))
    : 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 md:p-6 space-y-3.5 sm:space-y-4">
      {/* Header and stats strip */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>{label} Concentration Trend</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-normal">
              {unit}
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {fullName ? `${fullName}. ` : ''}Hourly concentrations mapped from the unified historical response.
          </p>
        </div>

        {/* Selected Pollutant Summary Badges */}
        {validPoints > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
            {stats.average != null && (
              <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                <span className="text-gray-400 mr-1 sm:mr-1.5">Avg:</span>
                <span className="font-bold text-gray-900">{stats.average} {unit}</span>
              </div>
            )}
            {stats.max != null && (
              <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-red-50 border border-red-100 text-xs">
                <span className="text-red-500 mr-1 sm:mr-1.5">Max:</span>
                <span className="font-bold text-red-700">{stats.max} {unit}</span>
              </div>
            )}
            {stats.min != null && (
              <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs">
                <span className="text-emerald-600 mr-1 sm:mr-1.5">Min:</span>
                <span className="font-bold text-emerald-800">{stats.min} {unit}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-80 md:h-96 w-full pt-2">
        {!hasData || validPoints === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <AlertCircle className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-600">No {label} observations in this interval</p>
            <p className="text-xs text-gray-400 mt-1">Try switching to another available pollutant.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -5, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

              <XAxis
                dataKey="dateLabel"
                interval={tickInterval}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />

              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                label={{
                  value: `${label} (${unit})`,
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: 11 },
                  offset: 10,
                }}
              />

              <Tooltip content={<PollutantTooltip label={label} unit={unit} color={color} />} />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
              />

              <Line
                type="monotone"
                dataKey={pollutantKey}
                name={`${label} (${unit})`}
                stroke={color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-gray-400" />
          <span>Metric values extracted directly from the combined historical query</span>
        </div>
        <span>Concentration unit: {unit} • IST</span>
      </div>
    </div>
  );
}

/**
 * Custom Tooltip for Pollutant Trend Chart
 */
function PollutantTooltip({ active, payload, label, unit, color }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0]?.payload;
  const value = payload[0]?.value;

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-3.5 text-xs min-w-52 z-50">
      <div className="border-b border-gray-100 pb-2 mb-2">
        <p className="font-bold text-gray-900">{point?.fullTime || point?.formattedTime}</p>
        <p className="text-[10px] text-gray-400">Indian Standard Time (IST)</p>
      </div>

      {value == null ? (
        <div className="text-amber-700 bg-amber-50 p-2 rounded-lg">
          No {label} measurement recorded for this hour
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-gray-600 font-medium">{label}:</span>
          </div>
          <span className="font-extrabold text-gray-900 text-sm">
            {value} <span className="font-normal text-xs text-gray-500">{unit}</span>
          </span>
        </div>
      )}
    </div>
  );
}
