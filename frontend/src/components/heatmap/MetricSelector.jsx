const METRICS = [
  {
    id: 'UAQI_RED_GREEN',
    name: 'Universal AQI',
  },
  {
    id: 'PM25_INDIGO_PERSIAN',
    name: 'PM2.5',
  },
];

export default function MetricSelector({ selectedMetric, onSelectMetric }) {
  return (
    <div className="flex items-center gap-2">
      {METRICS.map((metric) => {
        const isSelected = selectedMetric === metric.id;
        return (
          <button
            key={metric.id}
            type="button"
            onClick={() => onSelectMetric(metric.id)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isSelected
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {metric.name}
          </button>
        );
      })}
    </div>
  );
}
