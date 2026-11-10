import { cn, getAqiColors } from '../../lib/utils';

/**
 * Hero card displaying the Indian CPCB AQI prominently.
 * Any additional non-UAQI indexes returned by Google are shown as compact
 * badges below. The Universal AQI (uaqi) is intentionally omitted — only
 * India-specific AQI is surfaced here.
 *
 * Props:
 *   aqi — array of AQI index objects from the backend
 */
export default function AqiSummaryCard({ aqi }) {
  if (!aqi || aqi.length === 0) return null;

  const cpcb = aqi.find((a) => a.code === 'ind_cpcb');
  // Other indexes excluding uaqi and ind_cpcb
  const others = aqi.filter((a) => a.code !== 'uaqi' && a.code !== 'ind_cpcb');

  // If neither CPCB nor other indexes are present, nothing to show
  if (!cpcb && others.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 md:p-6">
      {/* Primary: CPCB AQI */}
      {cpcb && <AqiBlock index={cpcb} label="India AQI (CPCB)" />}

      {/* Additional indexes (badges) */}
      {others.length > 0 && (
        <div className={cn('flex flex-wrap gap-2', cpcb ? 'mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-gray-100' : '')}>
          {others.map((idx) => {
            const colors = getAqiColors(idx.code, idx.aqi);
            return (
              <span
                key={idx.code}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium',
                  colors.bg,
                  colors.text
                )}
              >
                {idx.displayName}:&nbsp;<strong>{idx.aqi ?? '—'}</strong>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Renders the full AQI ring block with label, category and dominant pollutant. */
function AqiBlock({ index, label }) {
  const colors = getAqiColors(index.code, index.aqi);

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      {/* Coloured ring circle */}
      <div
        className={cn(
          'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full ring-3 sm:ring-4 flex flex-col items-center justify-center flex-shrink-0',
          colors.ring,
          colors.bg
        )}
      >
        <span className={cn('text-3xl sm:text-4xl md:text-4xl font-extrabold leading-none', colors.text)}>
          {index.aqi ?? '—'}
        </span>
      </div>

      {/* Text info */}
      <div className="min-w-0">
        <p className="text-[11px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5 sm:mb-1">
          {label}
        </p>
        <p className={cn('text-lg sm:text-xl md:text-xl font-bold leading-snug', colors.text)}>
          {index.category ?? '—'}
        </p>
        {index.aqiDisplay && index.aqiDisplay !== String(index.aqi) && (
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{index.aqiDisplay}</p>
        )}
        {index.dominantPollutant && (
          <p className="text-[11px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2">
            Dominant pollutant:{' '}
            <span className="font-semibold text-gray-600 uppercase">
              {index.dominantPollutant}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
