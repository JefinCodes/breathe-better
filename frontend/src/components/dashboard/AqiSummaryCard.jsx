import { cn, getAqiColors } from '../../lib/utils';

/**
 * Hero card displaying the Universal AQI and Indian CPCB AQI side by side.
 * Any additional AQI indexes returned by Google are shown as compact badges below.
 *
 * Props:
 *   aqi        — array of AQI index objects from the backend
 *   pollutants — array of pollutant objects (used to show dominant pollutant info)
 */
export default function AqiSummaryCard({ aqi }) {
  if (!aqi || aqi.length === 0) return null;

  const uaqi = aqi.find((a) => a.code === 'uaqi');
  const cpcb = aqi.find((a) => a.code === 'ind_cpcb');
  const others = aqi.filter((a) => a.code !== 'uaqi' && a.code !== 'ind_cpcb');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-10">
        {/* Universal AQI */}
        {uaqi && <AqiBlock index={uaqi} label="Universal AQI" />}

        {/* Divider (desktop) */}
        {uaqi && cpcb && (
          <div className="hidden sm:block w-px bg-gray-100 self-stretch" />
        )}

        {/* India CPCB AQI */}
        {cpcb && <AqiBlock index={cpcb} label="India AQI (CPCB)" />}
      </div>

      {/* Additional indexes */}
      {others.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
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

/** Renders a single AQI circle with label, category and dominant pollutant. */
function AqiBlock({ index, label }) {
  const colors = getAqiColors(index.code, index.aqi);

  return (
    <div className="flex items-center gap-5 flex-1 min-w-0">
      {/* Coloured ring circle */}
      <div
        className={cn(
          'w-24 h-24 rounded-full ring-4 flex flex-col items-center justify-center flex-shrink-0',
          colors.ring,
          colors.bg
        )}
      >
        <span className={cn('text-3xl font-extrabold leading-none', colors.text)}>
          {index.aqi ?? '—'}
        </span>
      </div>

      {/* Text info */}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className={cn('text-sm font-semibold leading-snug', colors.text)}>
          {index.category ?? '—'}
        </p>
        {index.dominantPollutant && (
          <p className="text-xs text-gray-400 mt-1">
            Dominant pollutant:{' '}
            <span className="font-medium text-gray-600 uppercase">
              {index.dominantPollutant}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
