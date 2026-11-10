import { MapPin, Navigation } from 'lucide-react';
import { formatCityName } from '../../lib/utils';

/**
 * Displays the active location name, state, and type badge.
 *
 * Props:
 *   location — { name: string, state: string | null, isCurrent?: boolean } | null
 */
export default function LocationHeader({ location }) {
  const isCurrent = Boolean(location?.isCurrent || location?.name === 'Your Location');
  const name = location?.name
    ? isCurrent
      ? 'Your Current Location'
      : formatCityName(location.name)
    : '—';
  const state = location?.state || null;

  return (
    <div className="flex items-start gap-2.5 sm:gap-3">
      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-100">
        {isCurrent ? (
          <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 fill-emerald-50" />
        ) : (
          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{name}</h2>
          {isCurrent && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Device Location
            </span>
          )}
        </div>
        {state && <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{state}</p>}
      </div>
    </div>
  );
}
