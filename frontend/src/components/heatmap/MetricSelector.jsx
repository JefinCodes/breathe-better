import { Info, Sparkles, Wind } from 'lucide-react';

const METRICS = [
  {
    id: 'UAQI_RED_GREEN',
    key: 'aqi',
    name: 'Universal AQI',
    fullName: 'Universal Air Quality Index',
    badge: 'Standard UAQI (0–500)',
    description: 'Continuous multi-pollutant scale defined by Google Air Quality',
    icon: Sparkles,
  },
  {
    id: 'PM25_INDIGO_PERSIAN',
    key: 'pm25',
    name: 'PM2.5',
    fullName: 'Fine Particulate Matter (PM2.5)',
    badge: 'Concentration (µg/m³)',
    description: 'Fine inhalable particle concentration heatmap overlay',
    icon: Wind,
  },
];

export default function MetricSelector({ selectedMetric, onSelectMetric }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Select Heat Map Metric
        </label>
        <span className="text-xs text-gray-400">
          Showing metrics supported by Google Air Quality tile API
        </span>
      </div>

      {/* Metric Selector Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {METRICS.map((metric) => {
          const isSelected = selectedMetric === metric.id;
          const Icon = metric.icon;

          return (
            <button
              key={metric.id}
              type="button"
              onClick={() => onSelectMetric(metric.id)}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex items-start gap-3.5 ${
                isSelected
                  ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">
                    {metric.name}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-blue-200/80 text-blue-900'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {metric.badge}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                  {metric.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Universal AQI Clarification Notice */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 leading-relaxed">
          <span className="font-semibold text-amber-900">Universal AQI Notice: </span>
          The heat map layer uses Google&apos;s <strong>Universal Air Quality Index (UAQI)</strong> on a normalized <strong>0–500</strong> scale.
          UAQI is a continuous, globally consistent metric calculated from multiple pollutants and may differ from India&apos;s localized CPCB (Central Pollution Control Board) scale shown on the station dashboard.
        </div>
      </div>
    </div>
  );
}
