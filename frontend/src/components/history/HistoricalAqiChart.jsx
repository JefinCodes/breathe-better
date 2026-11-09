import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { History, AlertCircle, Info, Loader2 } from 'lucide-react';
import { getCpcbCategory } from '../../lib/historyUtils';

/**
 * HistoricalAqiChart
 *
 * Section 3: Historical AQI chart
 * - Hourly AQI observations using Recharts
 * - IST timestamps on X-axis and tooltips
 * - Handles missing observations (connectNulls={false})
 * - Adjusts presentation according to selected time range (7d / 14d / 30d)
 * - Reference thresholds for CPCB NAQI standard categories
 * - Never fabricates missing hourly data points
 */
export default function HistoricalAqiChart({
  chartData = [],
  isLoading = false,
  scaleName = 'CPCB NAQI (0–500)',
  cityName = '',
  diffDays = 7,
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center min-h-[380px]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-gray-700">Loading historical air quality observations…</p>
        <p className="text-xs text-gray-400 mt-1">Retrieving hourly historical data from Google API in IST</p>
      </div>
    );
  }

  const hasData = chartData && chartData.length > 0;
  const validPoints = hasData ? chartData.filter((d) => d.aqi != null).length : 0;

  // Dynamic X-axis tick interval based on number of points in selected range
  // <= 7 days (~168 hrs) -> tick every ~24 hrs
  // 14 days (~336 hrs) -> tick every ~48 hrs
  // 30 days (~720 hrs) -> tick every ~72-96 hrs
  const tickInterval = hasData
    ? Math.max(1, Math.floor(chartData.length / (diffDays <= 7 ? 7 : diffDays <= 14 ? 7 : 8)))
    : 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              3
            </span>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              <span>Historical AQI Trajectory</span>
              {cityName && <span className="text-gray-400 font-normal">({cityName})</span>}
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-8">
            Hourly continuous air quality index progression over the selected historical interval.
          </p>
        </div>

        {/* Legend info badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-gray-500">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span className="font-semibold text-gray-700">{scaleName}</span>
          <span className="text-gray-300">|</span>
          <span>{validPoints} of {chartData.length} hrs valid</span>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-80 sm:h-96 w-full pt-2">
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <AlertCircle className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-600">No historical observations to display</p>
            <p className="text-xs text-gray-400 mt-1">Select a valid date range or another Indian city.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 15, right: 25, left: 0, bottom: 20 }}
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
                domain={[0, (dataMax) => Math.max(500, Math.ceil((dataMax + 20) / 50) * 50)]}
                label={{
                  value: 'Air Quality Index (AQI)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: 11 },
                  offset: 10,
                }}
              />

              {/* CPCB Threshold Reference Lines */}
              <ReferenceLine y={50} stroke="#10b981" strokeDasharray="3 3" opacity={0.4} />
              <ReferenceLine y={100} stroke="#059669" strokeDasharray="3 3" opacity={0.4} />
              <ReferenceLine y={200} stroke="#eab308" strokeDasharray="3 3" opacity={0.5} />
              <ReferenceLine y={300} stroke="#f97316" strokeDasharray="3 3" opacity={0.5} />
              <ReferenceLine y={400} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />

              <Tooltip content={<HistoricalAqiTooltip scaleName={scaleName} />} />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
              />

              {/* Main AQI Line: connectNulls={false} guarantees missing observations are NOT fabricated */}
              <Line
                type="monotone"
                dataKey="aqi"
                name="Hourly AQI"
                stroke="#059669"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer notes */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-gray-400" />
          <span>Line gaps indicate hours where observations were missing from Google API. Missing data is never fabricated.</span>
        </div>
        <span>Timezone: IST (UTC+05:30)</span>
      </div>
    </div>
  );
}

/**
 * Custom IST Tooltip for Historical AQI Chart
 */
function HistoricalAqiTooltip({ active, payload, scaleName }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const aqiVal = point.aqi;
  const isMissing = aqiVal == null;
  const cat = !isMissing ? getCpcbCategory(aqiVal) : null;

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-3.5 text-xs min-w-56 z-50">
      <div className="border-b border-gray-100 pb-2 mb-2">
        <p className="font-bold text-gray-900">{point.fullTime || point.formattedTime}</p>
        <p className="text-[10px] text-gray-400">Indian Standard Time (IST)</p>
      </div>

      {isMissing ? (
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-2 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-500" />
          <span>No observation recorded for this hour</span>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium">Index Value:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-gray-900 text-sm">{aqiVal}</span>
              {cat && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${cat.bg} ${cat.text}`}
                >
                  {point.category || cat.category}
                </span>
              )}
            </div>
          </div>

          {point.dominantPollutant && (
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span>Dominant Pollutant:</span>
              <span className="font-semibold text-gray-700 uppercase">
                {point.dominantPollutant}
              </span>
            </div>
          )}

          <div className="pt-1.5 border-t border-gray-50 text-[10px] text-gray-400">
            Scale: {scaleName}
          </div>
        </div>
      )}
    </div>
  );
}
