import { useState } from 'react';
import { MapPin, Search, Check, Navigation } from 'lucide-react';
import CityAutocomplete from '../CityAutocomplete';
import { POPULAR_HISTORY_CITIES } from '../../lib/historyUtils';
import { formatCityName } from '../../lib/utils';

/**
 * CitySelectorSection
 *
 * Section 1: City selector
 * - Autocomplete backed by SQLite database via /api/cities/search
 * - Uses selected city's verified stored latitude and longitude
 * - Rejects arbitrary unverified city names
 * - Quick preset chips for prominent Indian cities
 */
export default function CitySelectorSection({ selectedCity, onCitySelect }) {
  const [isChanging, setIsChanging] = useState(false);

  const handleSelect = (city) => {
    if (city && city.latitude != null && city.longitude != null) {
      onCitySelect({
        geonameid: city.geonameid,
        name: city.name,
        state: city.state,
        latitude: city.latitude,
        longitude: city.longitude,
      });
      setIsChanging(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 md:p-6 space-y-3.5 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            Select City for Historical Tracking
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Verified Indian locations powered by SQLite database. Historical observations use exact geo-coordinates.
          </p>
        </div>

        {selectedCity && !isChanging && (
          <button
            type="button"
            onClick={() => setIsChanging(true)}
            className="self-start sm:self-auto text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Other City</span>
          </button>
        )}
      </div>

      {/* Selected City Highlight Card */}
      {selectedCity && (
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 via-teal-50/30 to-white border border-emerald-100/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-base">
                  {formatCityName(selectedCity.name)}
                </h3>
                {selectedCity.state && (
                  <span className="text-xs text-gray-500 font-normal">
                    • {selectedCity.state}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  <Check className="w-3 h-3" /> Selected
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-gray-400" />
                  {selectedCity.latitude.toFixed(4)}° N, {selectedCity.longitude.toFixed(4)}° E
                </span>
                <span className="text-gray-300">|</span>
                <span>ID: {selectedCity.geonameid}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* City Autocomplete Search Input */}
      {(!selectedCity || isChanging) && (
        <div className="space-y-2 pt-1">
          <CityAutocomplete
            onCitySelect={handleSelect}
            placeholder="Type city name (e.g., Delhi, Pune, Lucknow, Varanasi)..."
            clearOnSelect={false}
          />
          <p className="text-[11px] text-gray-400">
            Note: Select an item from suggestions. Arbitrary city names cannot be submitted.
          </p>
        </div>
      )}

      {/* Quick Select Popular Cities */}
      <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500 mr-1">
          Popular Cities:
        </span>
        {POPULAR_HISTORY_CITIES.map((city) => {
          const isCurrent = selectedCity?.geonameid === city.geonameid;
          return (
            <button
              key={city.geonameid}
              type="button"
              onClick={() => handleSelect(city)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                isCurrent
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              {city.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
