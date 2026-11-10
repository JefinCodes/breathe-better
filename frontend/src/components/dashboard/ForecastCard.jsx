import { cn, getAqiColors } from '../../lib/utils';
import { getCpcbCategory } from '../../lib/historyUtils';

/**
 * 24-hour forecast summary card.
 * Displays the aggregated AQI average for a 24-hour window, category indicator,
 * and time-range subtext.
 *
 * Props:
 *   title   — e.g. 'Next 24 Hours'
 *   aqi     — averaged AQI number (e.g. 142) or null
 *   subtext — e.g. 'Average AQI • 0 - 24 hours'
 */
export default function ForecastCard({ title, aqi, subtext }) {
  const colors = getAqiColors('ind_cpcb', aqi);
  const categoryInfo = getCpcbCategory(aqi);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-md">
      <div>
        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
          <h4 className="text-sm font-bold text-gray-800">{title}</h4>
          {aqi != null && (
            <span
              className={cn(
                'text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full border',
                colors.bg,
                colors.text,
                colors.border
              )}
            >
              {categoryInfo.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-3.5 my-2.5 sm:my-3">
          <div
            className={cn(
              'w-11 h-11 sm:w-12 sm:h-12 rounded-full ring-2 flex items-center justify-center flex-shrink-0',
              colors.ring,
              colors.bg
            )}
          >
            <span className={cn('text-base sm:text-lg font-bold leading-none', colors.text)}>
              {aqi ?? '—'}
            </span>
          </div>

          <div>
            <p className={cn('text-sm sm:text-base font-bold leading-tight', colors.text)}>
              {aqi != null ? `AQI ${aqi}` : 'No data'}
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
              {categoryInfo.category !== 'Unknown' ? categoryInfo.category : 'Unavailable'}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2.5 sm:pt-3 border-t border-gray-100 mt-2">
        <p className="text-[11px] sm:text-xs text-gray-400 font-medium">{subtext}</p>
      </div>
    </div>
  );
}
