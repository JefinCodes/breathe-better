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
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-100">
        {isCurrent ? (
          <Navigation className="w-4 h-4 text-blue-600 fill-blue-50" />
        ) : (
          <MapPin className="w-4 h-4 text-blue-600" />
        )}
      </div>
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-bold text-gray-900 leading-tight">{name}</h2>
          {isCurrent && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Device Location
            </span>
          )}
        </div>
        {state && <p className="text-sm text-gray-500 mt-0.5">{state}</p>}
      </div>
    </div>
  );
}
