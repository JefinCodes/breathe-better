import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { Layers, Activity } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' or pollutant code (e.g., 'pm25')

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

  // -------------------------------------------------------------------------
  // Case 1: "ALL" Tab - Grouped BarChart by Pollutant
  // -------------------------------------------------------------------------
  const groupedChartData = COMPARISON_POLLUTANTS.map((pDef) => {
    const item = {
      pollutantCode: pDef.code,
      pollutantName: pDef.name,
      fullName: pDef.fullName,
      unit: pDef.defaultUnit,
    };

    citiesPollutantData.forEach((city) => {
      const metric = city.metrics[pDef.code];
      // Store under key: `${city.cityName}`. If null, Recharts won't render fake 0 bar
      item[city.cityName] = metric?.value ?? null;
      if (metric?.units) item.unit = metric.units;
    });

    return item;
  });

  // -------------------------------------------------------------------------
  // Case 2: Specific Pollutant Tab (e.g., PM2.5)
  // -------------------------------------------------------------------------
  const selectedPDef = COMPARISON_POLLUTANTS.find((p) => p.code === activeTab);
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            C. Pollutant-Wise Comparison
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Compare key atmospheric pollutants across locations. Missing metrics are not shown as zero.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center flex-wrap gap-1 bg-gray-100/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'ALL'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
            }`}
          >
            All Pollutants
          </button>
          {COMPARISON_POLLUTANTS.map((p) => (
            <button
              key={p.code}
              type="button"
              onClick={() => setActiveTab(p.code)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === p.code
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/40'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Render Chart Based on Active Tab */}
      {activeTab === 'ALL' ? (
        <div className="space-y-4">
          {/* Units Reference Strip */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-150">
            <span className="font-semibold text-gray-700 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              Units:
            </span>
            <span>PM2.5 (µg/m³)</span>
            <span>•</span>
            <span>PM10 (µg/m³)</span>
            <span>•</span>
            <span>NO₂ (ppb)</span>
            <span>•</span>
            <span>SO₂ (ppb)</span>
            <span>•</span>
            <span>CO (ppm)</span>
            <span>•</span>
            <span>O₃ (ppb)</span>
          </div>

          {/* Grouped Bar Chart */}
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={groupedChartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="pollutantName"
                  tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  label={{
                    value: 'Concentration Value',
                    angle: -90,
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: '#9ca3af', fontSize: 11 },
                    offset: 0,
                  }}
                />
                <Tooltip content={<GroupedTooltip />} cursor={{ fill: 'rgba(243, 244, 246, 0.6)' }} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
                />
                {citiesPollutantData.map((city) => (
                  <Bar
                    key={city.cityId}
                    dataKey={city.cityName}
                    fill={city.color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* Single Pollutant Chart */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
            <span className="font-semibold text-blue-900">
              {selectedPDef?.fullName} ({selectedPDef?.label})
            </span>
            <span className="font-medium text-blue-700">
              Unit: <strong>{selectedPDef?.defaultUnit}</strong>
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={singlePollutantChartData}
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
      )}

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
 * Custom Tooltip for Grouped Pollutant Chart
 */
function GroupedTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload;

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-3.5 text-xs min-w-48 z-50">
      <div className="border-b border-gray-100 pb-2 mb-2">
        <p className="font-bold text-gray-900 text-sm">{item?.fullName || label}</p>
        <p className="text-[11px] text-gray-500">
          Unit: <strong>{item?.unit}</strong>
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
              <span className="text-gray-700 truncate">{entry.name}:</span>
            </div>
            <span className="font-bold text-gray-900">
              {entry.value != null ? `${entry.value} ${item?.unit}` : 'Not reported'}
            </span>
          </div>
        ))}
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
