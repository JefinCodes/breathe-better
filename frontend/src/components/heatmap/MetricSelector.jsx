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
    <div className="grid grid-cols-2 gap-2 max-w-md w-full">
      {METRICS.map((metric) => {
        const isSelected = selectedMetric === metric.id;
        return (
          <button
            key={metric.id}
            type="button"
            onClick={() => onSelectMetric(metric.id)}
            className={`flex items-center justify-center text-center py-2.5 px-4 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
