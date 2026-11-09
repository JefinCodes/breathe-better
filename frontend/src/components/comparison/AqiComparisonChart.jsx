import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { BarChart3, Info } from 'lucide-react';
import { formatCityName, getAqiColors } from '../../lib/utils';
import { getCityColor } from '../../lib/comparisonUtils';

/**
 * Section B: AQI Comparison Chart
 *
 * Compares current AQI values across all selected cities using Recharts.
 * Clearly identifies the AQI scale being compared.
 */
export default function AqiComparisonChart({ selectedCities, currentQueries }) {
  if (selectedCities.length === 0) return null;

  // Build chart dataset
  const chartData = selectedCities.map((city, index) => {
    const query = currentQueries[index];
    const data = query?.data?.data;
    const cpcb = data?.aqi?.find((a) => a.code === 'ind_cpcb');
    const primaryAqi = cpcb || data?.aqi?.[0];

    return {
      id: city.geonameid,
      cityName: formatCityName(city.name),
      state: city.state,
      aqi: primaryAqi?.aqi ?? null,
      category: primaryAqi?.category ?? 'Unknown',
      code: primaryAqi?.code ?? 'unknown',
      displayName: primaryAqi?.displayName ?? 'AQI',
      dominantPollutant: primaryAqi?.dominantPollutant ?? '—',
      color: getCityColor(index),
    };
  });

  // Check scale uniformity
  const allCpcb = chartData.every((d) => d.code === 'ind_cpcb');
  const maxAqi = Math.max(...chartData.map((d) => d.aqi || 0), 100);
  const yDomainMax = Math.min(500, Math.ceil((maxAqi + 50) / 50) * 50);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Title & Scale Identifier */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            B. Current AQI Comparison
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Side-by-side comparison of real-time air quality index across selected locations.
          </p>
        </div>

        {/* Prominent Scale Identifier Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900">
          <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
          <span>
            {allCpcb ? (
              <>
                Scale:&nbsp;<strong>India National AQI (CPCB) — 0 to 500</strong> (Lower is cleaner)
              </>
            ) : (
              <>
                Scale:&nbsp;<strong>Normalized AQI Scale</strong>
              </>
            )}
          </span>
        </div>
      </div>

      {/* CPCB Category Reference Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 text-[11px] text-center pt-1">
        <span className="py-1 px-2 rounded-lg bg-green-50 text-green-700 font-medium">
          Good (0–50)
        </span>
        <span className="py-1 px-2 rounded-lg bg-emerald-50 text-emerald-700 font-medium">
          Satisfactory (51–100)
        </span>
        <span className="py-1 px-2 rounded-lg bg-yellow-50 text-yellow-700 font-medium">
          Moderate (101–200)
        </span>
        <span className="py-1 px-2 rounded-lg bg-orange-50 text-orange-700 font-medium">
          Poor (201–300)
        </span>
        <span className="py-1 px-2 rounded-lg bg-red-50 text-red-700 font-medium">
          Very Poor (301–400)
        </span>
        <span className="py-1 px-2 rounded-lg bg-rose-100 text-rose-900 font-medium">
          Severe (401–500)
        </span>
      </div>

      {/* Recharts BarChart */}
      <div className="h-80 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="cityName"
              tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              domain={[0, yDomainMax]}
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

            {/* Threshold Reference Lines */}
            <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Satisfactory (100)', fill: '#10b981', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine y={200} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'Moderate (200)', fill: '#ca8a04', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine y={300} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'Poor (300)', fill: '#ea580c', fontSize: 10, position: 'insideTopRight' }} />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(243, 244, 246, 0.6)' }}
            />

            <Bar
              dataKey="aqi"
              radius={[8, 8, 0, 0]}
              maxBarSize={64}
              animationDuration={800}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.id}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend showing City Names and Colors */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-gray-100 text-xs">
        {chartData.map((entry) => (
          <div key={entry.id} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-md"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-semibold text-gray-800">{entry.cityName}:</span>
            <span className="text-gray-600 font-bold">{entry.aqi ?? '—'}</span>
            <span className="text-[11px] text-gray-400">({entry.category})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Custom Tooltip for the AQI BarChart
 */
function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const colors = getAqiColors(data.code, data.aqi);

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-3.5 text-xs min-w-44 z-50">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-2">
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: data.color }}
        />
        <div>
          <p className="font-bold text-gray-900 leading-tight">{data.cityName}</p>
          <p className="text-[10px] text-gray-500">{data.state}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">AQI Value:</span>
          <span className="font-extrabold text-base text-gray-900">{data.aqi ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Category:</span>
          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${colors.bg} ${colors.text}`}>
            {data.category}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Dominant:</span>
          <span className="font-semibold text-gray-700 uppercase">
            {data.dominantPollutant}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[10px] text-gray-400">
          <span>Scale:</span>
          <span>{data.code === 'ind_cpcb' ? 'CPCB (0–500)' : data.displayName}</span>
        </div>
      </div>
    </div>
  );
}
