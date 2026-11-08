import { cn, getAqiColors, formatForecastHour } from '../../lib/utils';

/**
 * Compact forecast tile for a single hour.
 * Shows IST time, an AQI colour-ring circle and the category label.
 * Preferentially shows CPCB (Indian) AQI for India-focused data, with
 * Universal AQI as a fallback.
 *
 * Props:
 *   hour — single element from the forecast array
 *     { timestamp, aqi[], pollutants[], healthRecommendations }
 */
export default function ForecastCard({ hour }) {
  const cpcb = hour.aqi?.find((a) => a.code === 'ind_cpcb');
  const uaqi = hour.aqi?.find((a) => a.code === 'uaqi');
  const primary = cpcb || uaqi || null;

  const colors = primary
    ? getAqiColors(primary.code, primary.aqi)
    : getAqiColors(null, null);

  const { day, time } = formatForecastHour(hour.timestamp);

  // Extract the first word of the category for compact display
  const shortCategory = primary?.category?.split(' ')[0] ?? '—';

  return (
    <div className="flex-shrink-0 w-[72px] bg-white border border-gray-100 rounded-xl p-2.5 text-center shadow-sm">
      {/* Time */}
      <p className="text-[10px] font-semibold text-gray-400 leading-none">{day}</p>
      <p className="text-[10px] text-gray-400 mt-0.5 leading-none">{time}</p>

      {/* AQI ring */}
      <div
        className={cn(
          'w-9 h-9 rounded-full ring-2 flex items-center justify-center mx-auto my-2',
          colors.ring,
          colors.bg
        )}
      >
        <span className={cn('text-xs font-bold leading-none', colors.text)}>
          {primary?.aqi ?? '—'}
        </span>
      </div>

      {/* Category label (truncated) */}
      <p className={cn('text-[10px] font-medium leading-tight', colors.text)}>
        {shortCategory}
      </p>
    </div>
  );
}
