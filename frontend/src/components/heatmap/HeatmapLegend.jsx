/**
 * Legend component for Google Air Quality Heat Map.
 * Renders color scale, categories, and numeric intervals for:
 * 1. Universal AQI (UAQI_RED_GREEN) - Red-Green 0-500 scale
 * 2. PM2.5 (PM25_INDIGO_PERSIAN) - Indigo-Persian concentration scale
 */

const UAQI_LEVELS = [
  { range: '0–50', label: 'Good', color: '#10B981', textColor: 'text-emerald-900', bg: 'bg-emerald-500' },
  { range: '51–100', label: 'Moderate', color: '#EAB308', textColor: 'text-yellow-900', bg: 'bg-yellow-500' },
  { range: '101–150', label: 'Unhealthy for Sensitive', color: '#F97316', textColor: 'text-orange-900', bg: 'bg-orange-500' },
  { range: '151–200', label: 'Unhealthy', color: '#EF4444', textColor: 'text-red-900', bg: 'bg-red-500' },
  { range: '201–300', label: 'Very Unhealthy', color: '#A855F7', textColor: 'text-purple-900', bg: 'bg-purple-500' },
  { range: '301–500', label: 'Hazardous', color: '#881337', textColor: 'text-rose-950', bg: 'bg-rose-900' },
];

const PM25_LEVELS = [
  { range: '0–12', label: 'Low / Good', color: '#38BDF8', textColor: 'text-sky-900', bg: 'bg-sky-400' },
  { range: '12.1–35.4', label: 'Moderate', color: '#6366F1', textColor: 'text-indigo-900', bg: 'bg-indigo-500' },
  { range: '35.5–55.4', label: 'Unhealthy for Sensitive', color: '#8B5CF6', textColor: 'text-violet-900', bg: 'bg-violet-500' },
  { range: '55.5–150.4', label: 'Unhealthy', color: '#C084FC', textColor: 'text-purple-900', bg: 'bg-purple-400' },
  { range: '150.5–250.4', label: 'Very Unhealthy', color: '#EC4899', textColor: 'text-pink-900', bg: 'bg-pink-500' },
  { range: '> 250.4', label: 'Severe / Hazardous', color: '#BE185D', textColor: 'text-pink-950', bg: 'bg-pink-700' },
];

export default function HeatmapLegend({ metric }) {
  const isAqi = metric === 'UAQI_RED_GREEN';
  const levels = isAqi ? UAQI_LEVELS : PM25_LEVELS;
  const title = isAqi
    ? 'Universal Air Quality Index (UAQI) Legend'
    : 'PM2.5 Concentration Legend (µg/m³)';
  const subtitle = isAqi
    ? 'Standard Universal AQI continuous palette (0–500)'
    : 'Google Indigo-Persian fine particulate color gradient';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          {title}
        </h4>
        <span className="text-[11px] text-gray-500">{subtitle}</span>
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
