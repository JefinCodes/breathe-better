import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { History, Calendar, Loader2 } from 'lucide-react';
import { formatCityName } from '../../lib/utils';
import {
  getCityColor,
  formatHistoryTimestampIST,
} from '../../lib/comparisonUtils';

/**
 * Section D: Historical AQI Comparison
 *
 * Displays hourly historical AQI trends for all selected cities over the exact same interval.
 * Recharts LineChart with multiple city series, IST timestamps, and connectNulls={false}.
 */
export default function HistoricalAqiChart({
  selectedCities,
  historyQueries,
  startDate,
  endDate,
  onPresetChange,
  activePreset,
  onCustomDateChange,
}) {
  if (selectedCities.length === 0) return null;

  const isAnyLoading = historyQueries.some((q) => q.isLoading);

  // -------------------------------------------------------------------------
  // Align observations across all cities by timestamp
  // -------------------------------------------------------------------------
  // 1. Gather all observations per city
  const cityObsMap = selectedCities.map((city, index) => {
    const query = historyQueries[index];
    const observations = query?.data?.data?.observations || [];
    const obsByTimestamp = new Map();

    observations.forEach((obs) => {
      if (!obs.timestamp) return;
      const cpcb = obs.aqi?.find((a) => a.code === 'ind_cpcb');
      const primary = cpcb || obs.aqi?.[0];
      obsByTimestamp.set(obs.timestamp, {
        aqi: primary?.aqi ?? null,
        category: primary?.category ?? null,
      });
    });

    return {
      cityId: city.geonameid,
      cityName: formatCityName(city.name),
      color: getCityColor(index),
      obsByTimestamp,
    };
  });

  // 2. Build sorted set of all unique timestamps
  const allTimestampsSet = new Set();
  cityObsMap.forEach((c) => {
    c.obsByTimestamp.forEach((_, ts) => allTimestampsSet.add(ts));
  });
  const sortedTimestamps = Array.from(allTimestampsSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // 3. Create flat data points for Recharts
  const chartData = sortedTimestamps.map((ts) => {
    const point = {
      timestamp: ts,
      formattedTime: formatHistoryTimestampIST(ts, 'short'),
      dateLabel: formatHistoryTimestampIST(ts, 'dateOnly'),
    };

    cityObsMap.forEach((c) => {
      const match = c.obsByTimestamp.get(ts);
      // Explicit null for missing observations (connectNulls={false} skips it)
      point[c.cityName] = match?.aqi ?? null;
      point[`${c.cityName}_category`] = match?.category ?? '—';
    });

    return point;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5">
      {/* Header & Date Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            D. Historical AQI Trends
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Hourly air quality index trajectory over the shared interval (IST).
          </p>
        </div>

        {/* Date Interval Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => onPresetChange(7)}
              className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                activePreset === 7
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Past 7 Days
            </button>
            <button
              type="button"
              onClick={() => onPresetChange(14)}
              className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                activePreset === 14
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Past 14 Days
            </button>
            <button
              type="button"
              onClick={() => onPresetChange(30)}
              className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                activePreset === 30
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Past 30 Days
            </button>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onCustomDateChange(e.target.value, endDate)}
              className="bg-transparent border-none text-xs text-gray-700 focus:outline-none p-0 cursor-pointer"
              title="Start Date"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onCustomDateChange(startDate, e.target.value)}
              className="bg-transparent border-none text-xs text-gray-700 focus:outline-none p-0 cursor-pointer"
              title="End Date"
            />
          </div>
        </div>
      </div>

      {/* Loading Banner */}
      {isAnyLoading && (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-blue-600 bg-blue-50/50 rounded-xl">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Synchronizing historical observations for selected cities…</span>
        </div>
      )}

      {/* Chart */}
      <div className="h-88 w-full">
        {chartData.length === 0 && !isAnyLoading ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400">
            No historical AQI records available for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                interval={Math.max(1, Math.floor(chartData.length / 8))}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                label={{
                  value: 'Air Quality Index (AQI)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#9ca3af', fontSize: 11 },
                  offset: 0,
                }}
              />

              <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" opacity={0.6} />
              <ReferenceLine y={200} stroke="#eab308" strokeDasharray="3 3" opacity={0.6} />
              <ReferenceLine y={300} stroke="#f97316" strokeDasharray="3 3" opacity={0.6} />

              <Tooltip content={<HistoricalTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
              />

              {cityObsMap.map((city) => (
                <Line
                  key={city.cityId}
                  type="monotone"
                  dataKey={city.cityName}
                  stroke={city.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                  connectNulls={false} // Never invent fake connections through missing hours
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
        <span>Timestamps displayed in Indian Standard Time (IST, UTC+05:30)</span>
        <span>Capped at Google API maximum 30-day historical interval</span>
      </div>
    </div>
  );
}

/**
 * Custom Tooltip for Historical AQI Chart
 */
function HistoricalTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0]?.payload;

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-3.5 text-xs min-w-48 z-50">
      <div className="border-b border-gray-100 pb-2 mb-2">
        <p className="font-bold text-gray-900">{point?.formattedTime}</p>
        <p className="text-[10px] text-gray-400">Indian Standard Time (IST)</p>
      </div>

      <div className="space-y-1.5">
        {payload.map((entry) => {
          const category = point?.[`${entry.name}_category`];
          return (
            <div key={entry.name} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-700 font-medium truncate">{entry.name}:</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-900">
                  {entry.value != null ? entry.value : 'No data'}
                </span>
                {category && category !== '—' && (
                  <span className="text-[10px] text-gray-400 ml-1">({category})</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
