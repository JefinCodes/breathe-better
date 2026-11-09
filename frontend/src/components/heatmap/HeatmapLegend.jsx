/**
 * Levels and colors corresponding to Google Air Quality API's heatmap overlays:
 * - UAQI_RED_GREEN: Universal AQI (0–100 scale; 100 represents cleanest air, 0 represents poorest air).
 *   Gradient spans Green (#22C55E) -> Lime (#84CC16) -> Yellow (#EAB308) -> Orange (#F97316) -> Red (#EF4444).
 * - PM25_INDIGO_PERSIAN: PM2.5 concentration in µg/m³.
 *   Gradient spans Teal (#05B1A2) -> Lime (#84CC16) -> Amber (#F59E0B) -> Red (#EF4444) -> Persian Red (#B00F2F) -> Persian Purple (#8A16AB).
 */
const UAQI_LEVELS = [
  { range: '80–100', label: 'Excellent', color: '#22C55E' },
  { range: '60–79', label: 'Good', color: '#84CC16' },
  { range: '40–59', label: 'Moderate', color: '#EAB308' },
  { range: '20–39', label: 'Low', color: '#F97316' },
  { range: '0–19', label: 'Poor', color: '#EF4444' },
];

const PM25_LEVELS = [
  { range: '0–12', label: 'Low', color: '#05B1A2' },
  { range: '12.1–35.4', label: 'Moderate', color: '#84CC16' },
  { range: '35.5–55.4', label: 'Unhealthy for Sensitive', color: '#F59E0B' },
  { range: '55.5–150.4', label: 'Unhealthy', color: '#EF4444' },
  { range: '150.5–250.4', label: 'Very Unhealthy', color: '#B00F2F' },
  { range: '> 250.4', label: 'Hazardous', color: '#8A16AB' },
];

export default function HeatmapLegend({ metric }) {
  const isAqi = metric === 'UAQI_RED_GREEN';
  const levels = isAqi ? UAQI_LEVELS : PM25_LEVELS;
  const title = isAqi ? 'Universal AQI' : 'PM2.5 (µg/m³)';
  const subtitle = isAqi
    ? '0–100 scale (higher score indicates cleaner air)'
    : 'Concentration (lower value indicates cleaner air)';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          {title}
        </h4>
        <span className="text-[11px] text-gray-500 font-medium">
          {subtitle}
        </span>
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
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 ${
          isAqi ? 'md:grid-cols-5' : 'md:grid-cols-6'
        } gap-2 pt-1`}
      >
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
