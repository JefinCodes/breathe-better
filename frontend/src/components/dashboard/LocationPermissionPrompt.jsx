import { MapPin, Navigation } from 'lucide-react';
import CityAutocomplete from '../CityAutocomplete';

/**
 * Shown when no location is available (GPS denied / unavailable) or when
 * the user explicitly requests to change their location.
 *
 * Props:
 *   geoStatus   — 'denied' | 'unavailable' | 'idle'
 *   onCitySelect — callback(city) called when a city suggestion is selected
 */
export default function LocationPermissionPrompt({ geoStatus, onCitySelect }) {
  const isDenied = geoStatus === 'denied';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Brand + icon */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            {isDenied ? (
              <Navigation className="w-7 h-7 text-emerald-400" />
            ) : (
              <MapPin className="w-7 h-7 text-emerald-500" />
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Breathe Better</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {isDenied
              ? 'Location access was denied. Search for a city below to check its air quality.'
              : 'Search for an Indian city to check real-time air quality.'}
          </p>
        </div>

        {/* City autocomplete */}
        <CityAutocomplete
          onCitySelect={onCitySelect}
          placeholder="Search for a city in India…"
        />

        <p className="mt-4 text-center text-xs text-gray-400">
          Select a suggestion from the list to continue.
        </p>
      </div>
    </div>
  );
}
