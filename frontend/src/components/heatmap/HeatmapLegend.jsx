const UAQI_LEVELS = [
  { range: '0–50', label: 'Good', color: '#10B981' },
  { range: '51–100', label: 'Moderate', color: '#EAB308' },
  { range: '101–150', label: 'Unhealthy for Sensitive', color: '#F97316' },
  { range: '151–200', label: 'Unhealthy', color: '#EF4444' },
  { range: '201–300', label: 'Very Unhealthy', color: '#A855F7' },
  { range: '301–500', label: 'Hazardous', color: '#881337' },
];

const PM25_LEVELS = [
  { range: '0–12', label: 'Low', color: '#38BDF8' },
  { range: '12.1–35.4', label: 'Moderate', color: '#6366F1' },
  { range: '35.5–55.4', label: 'Unhealthy for Sensitive', color: '#8B5CF6' },
  { range: '55.5–150.4', label: 'Unhealthy', color: '#C084FC' },
  { range: '150.5–250.4', label: 'Very Unhealthy', color: '#EC4899' },
  { range: '> 250.4', label: 'Hazardous', color: '#BE185D' },
];

export default function HeatmapLegend({ metric }) {
  const isAqi = metric === 'UAQI_RED_GREEN';
  const levels = isAqi ? UAQI_LEVELS : PM25_LEVELS;
  const title = isAqi ? 'Universal AQI' : 'PM2.5 (µg/m³)';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          {title}
        </h4>
      </div>

      {/* Visual continuous gradient bar */}
      <div className="w-full h-2.5 rounded-full overflow-hidden flex shadow-inner">
        {levels.map((lvl, idx) => (
          <div
            key={idx}
            className="flex-1 h-full"
            style={{ backgroundColor: lvl.color }}
            title={`${lvl.label} (${lvl.range})`}
          />
        ))}
      </div>

      {/* Legend categories grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
        {levels.map((lvl, idx) => (
          <div
            key={idx}
            className="flex flex-col items-start p-2 rounded-lg bg-gray-50/80 border border-gray-100"
          >
            <div className="flex items-center gap-1.5 w-full">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: lvl.color }}
              />
              <span className="text-xs font-bold text-gray-800 truncate">
                {lvl.range}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">
              {lvl.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
