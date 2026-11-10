import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Layers } from 'lucide-react';
import { formatCityName, formatUnit } from '../../lib/utils';
import {
  COMPARISON_POLLUTANTS,
  getCityColor,
} from '../../lib/comparisonUtils';

/**
 * Section C: Pollutant-wise Comparison Chart
 *
 * Compares PM2.5, PM10, NO2, SO2, CO, and O3 across selected cities.
 * Strictly avoids showing missing metrics as zero (uses null).
 * Clearly indicates units for each pollutant.
 */
export default function PollutantComparisonChart({
  selectedCities,
  currentQueries,
}) {
  const [activeTab, setActiveTab] = useState(COMPARISON_POLLUTANTS[0].code); // defaults to 'pm25'

  if (selectedCities.length === 0) return null;

  // Extract pollutant values for each city
  // Returns: { cityId, cityName, pollutants: { [code]: { value, units } } }
  const citiesPollutantData = selectedCities.map((city, index) => {
    const query = currentQueries[index];
    const pollutants = query?.data?.data?.pollutants || [];

    const map = {};
    COMPARISON_POLLUTANTS.forEach((pDef) => {
      const match = pollutants.find((p) => p.code?.toLowerCase() === pDef.code.toLowerCase());
      if (match && match.concentration && match.concentration.value != null) {
        map[pDef.code] = {
          value: match.concentration.value,
          units: formatUnit(match.concentration.units) || pDef.defaultUnit,
        };
      } else {
        // Missing metric: MUST be null, never 0
        map[pDef.code] = {
          value: null,
          units: pDef.defaultUnit,
        };
      }
    });

    return {
      cityId: city.geonameid,
      cityName: formatCityName(city.name),
      state: city.state,
      color: getCityColor(index),
      metrics: map,
    };
  });

  // Specific Pollutant Tab Data (e.g., PM2.5)
  const selectedPDef =
    COMPARISON_POLLUTANTS.find((p) => p.code === activeTab) || COMPARISON_POLLUTANTS[0];
  const singlePollutantChartData = citiesPollutantData.map((city) => {
    const metric = city.metrics[activeTab];
    return {
      cityName: city.cityName,
      state: city.state,
      value: metric?.value ?? null,
      unit: metric?.units || selectedPDef?.defaultUnit || 'µg/m³',
      color: city.color,
      fullName: selectedPDef?.fullName,
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            C. Pollutant-Wise Comparison
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Compare key atmospheric pollutants across locations. Missing metrics are not shown as zero.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center flex-wrap gap-1 bg-gray-100/80 p-1 rounded-xl">
          {COMPARISON_POLLUTANTS.map((p) => (
            <button
              key={p.code}
              type="button"
              onClick={() => setActiveTab(p.code)}
              className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-lg transition-all ${
                activeTab === p.code
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Single Pollutant Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-gray-500 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 flex-wrap gap-2">
          <span className="font-semibold text-emerald-900">
            {selectedPDef?.fullName} ({selectedPDef?.label})
          </span>
          <span className="font-medium text-emerald-700">
            Unit: <strong>{selectedPDef?.defaultUnit}</strong>
          </span>
        </div>

        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={singlePollutantChartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="cityName"
                tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                label={{
                  value: `Concentration (${selectedPDef?.defaultUnit})`,
                  angle: -90,
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fill: '#9ca3af', fontSize: 11 },
                  offset: 0,
                }}
              />
              <Tooltip content={<SinglePollutantTooltip />} cursor={{ fill: 'rgba(243, 244, 246, 0.6)' }} />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              >
                {singlePollutantChartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Multi-City Pollutant Matrix Table */}
      <div className="overflow-x-auto pt-2">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3 font-semibold">City</th>
              {COMPARISON_POLLUTANTS.map((p) => (
                <th key={p.code} className="py-2.5 px-3 font-semibold text-right">
                  {p.label} <span className="normal-case text-gray-400">({p.defaultUnit})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {citiesPollutantData.map((city) => (
              <tr key={city.cityId} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-2.5 px-3 font-bold text-gray-900 flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: city.color }}
                  />
                  <span>{city.cityName}</span>
                </td>
                {COMPARISON_POLLUTANTS.map((p) => {
                  const val = city.metrics[p.code]?.value;
                  const unit = city.metrics[p.code]?.units;
                  return (
                    <td key={p.code} className="py-2.5 px-3 text-right">
                      {val != null ? (
                        <span className="font-semibold text-gray-800">
                          {val}&nbsp;<span className="text-[10px] text-gray-400">{unit}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Not reported</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Custom Tooltip for Single Pollutant Chart
 */
function SinglePollutantTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-3.5 text-xs min-w-44 z-50">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-2">
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: data.color }}
        />
        <div>
          <p className="font-bold text-gray-900">{data.cityName}</p>
          <p className="text-[10px] text-gray-500">{data.state}</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Pollutant:</span>
          <span className="font-semibold text-gray-800">{data.fullName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Concentration:</span>
          <span className="font-extrabold text-sm text-gray-900">
            {data.value != null ? `${data.value} ${data.unit}` : 'Not reported'}
          </span>
        </div>
      </div>
    </div>
  );
}
