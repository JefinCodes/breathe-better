import { MapPin } from 'lucide-react';
import { formatCityName } from '../../lib/utils';

/**
 * Displays the active location name and state.
 *
 * Props:
 *   location — { name: string, state: string | null } | null
 */
export default function LocationHeader({ location }) {
  const name = location?.name ? formatCityName(location.name) : '—';
  const state = location?.state || null;

  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
        <MapPin className="w-4 h-4 text-blue-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900 leading-tight">{name}</h2>
        {state && <p className="text-sm text-gray-500 mt-0.5">{state}</p>}
      </div>
    </div>
  );
}
