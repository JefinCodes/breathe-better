import { useState } from 'react';
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
import { TrendingUp, Info } from 'lucide-react';
import { formatCityName, formatUnit } from '../../lib/utils';
import {
  COMPARISON_POLLUTANTS,
  getCityColor,
  formatHistoryTimestampIST,
} from '../../lib/comparisonUtils';

/**
 * Section E: Historical Pollutant Comparison
 *
 * Allows users to select and compare historical hourly trends for specific pollutants
 * (PM2.5, PM10, NO2, SO2, CO, O3) across all selected cities over the shared interval.
 */
export default function HistoricalPollutantChart({
  selectedCities,
  historyQueries,
  startDate,
  endDate,
}) {
  const [selectedPollutantCode, setSelectedPollutantCode] = useState('pm25');

  if (selectedCities.length === 0) return null;

  const currentPollutant =
    COMPARISON_POLLUTANTS.find((p) => p.code === selectedPollutantCode) ||
    COMPARISON_POLLUTANTS[0];

  // 1. Gather all observations for the selected pollutant per city
  let detectedUnit = currentPollutant.defaultUnit;

  const cityObsMap = selectedCities.map((city, index) => {
    const query = historyQueries[index];
    const observations = query?.data?.data?.observations || [];
    const obsByTimestamp = new Map();

    observations.forEach((obs) => {
      if (!obs.timestamp) return;
      const match = obs.pollutants?.find(
        (p) => p.code?.toLowerCase() === selectedPollutantCode.toLowerCase()
      );
      if (match?.concentration?.value != null) {
        obsByTimestamp.set(obs.timestamp, match.concentration.value);
        if (match.concentration.units) {
          detectedUnit = formatUnit(match.concentration.units);
        }
      } else {
        obsByTimestamp.set(obs.timestamp, null);
      }
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

  // 3. Create flat chart data points
  const chartData = sortedTimestamps.map((ts) => {
    const point = {
      timestamp: ts,
      formattedTime: formatHistoryTimestampIST(ts, 'short'),
      dateLabel: formatHistoryTimestampIST(ts, 'dateOnly'),
    };

    cityObsMap.forEach((c) => {
      // Missing value stays null; Recharts will not render fake zero
      point[c.cityName] = c.obsByTimestamp.get(ts) ?? null;
    });

    return point;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5">
      {/* Header & Pollutant Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            E. Historical Pollutant Comparison
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Compare historical hourly concentrations for individual pollutants over the same period.
          </p>
        </div>

        {/* Pollutant Tabs */}
        <div className="flex items-center flex-wrap gap-1 bg-gray-100/80 p-1 rounded-xl">
          {COMPARISON_POLLUTANTS.map((p) => (
            <button
              key={p.code}
              type="button"
              onClick={() => setSelectedPollutantCode(p.code)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedPollutantCode === p.code
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pollutant Info Strip */}
      <div className="flex items-center justify-between text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-150">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold text-gray-800">
            {currentPollutant.fullName} ({currentPollutant.label})
          </span>
        </div>
        <span className="text-gray-600 font-medium">
          Concentration unit: <strong className="text-gray-900">{detectedUnit}</strong>
        </span>
      </div>

      {/* Chart */}
      <div className="h-88 w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400">
            No historical records found for {currentPollutant.label} during this time frame.
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
                  value: `Concentration (${detectedUnit})`,
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#9ca3af', fontSize: 11 },
                  offset: 0,
                }}
              />
              <Tooltip content={<PollutantHistoryTooltip unit={detectedUnit} pollutantName={currentPollutant.label} />} />
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
                  connectNulls={false} // Never introduce fake zeros for missing pollutant values
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
        <span>Missing observations rendered as gaps, preserving data integrity</span>
        <span>Interval: {startDate} to {endDate}</span>
      </div>
    </div>
  );
}

/**
 * Custom Tooltip for Historical Pollutant Chart
 */
function PollutantHistoryTooltip({ active, payload, unit, pollutantName }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0]?.payload;

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-3.5 text-xs min-w-48 z-50">
      <div className="border-b border-gray-100 pb-2 mb-2">
        <p className="font-bold text-gray-900">{point?.formattedTime}</p>
        <p className="text-[10px] text-gray-500">
          {pollutantName} ({unit}) • IST
        </p>
      </div>

      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 font-medium truncate">{entry.name}:</span>
            </div>
            <span className="font-bold text-gray-900">
              {entry.value != null ? `${entry.value} ${unit}` : 'No data'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
