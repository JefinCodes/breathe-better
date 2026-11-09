import { MapPin, X, Plus, AlertCircle, RotateCcw } from 'lucide-react';
import CityAutocomplete from '../CityAutocomplete';
import { formatCityName } from '../../lib/utils';
import { getCityColor, POPULAR_CITIES } from '../../lib/comparisonUtils';

/**
 * CitySelectorSection
 *
 * Allows users to select multiple cities for comparison via SQLite autocomplete.
 * Retains for each city: geonameid, name, state, latitude, longitude.
 * Arbitrary text is rejected; only valid autocomplete selections are accepted.
 */
export default function CitySelectorSection({
  selectedCities,
  onAddCity,
  onRemoveCity,
  onClearAll,
  onResetDefault,
}) {
  const isCityAlreadySelected = (city) => {
    return selectedCities.some(
      (c) =>
        c.geonameid === city.geonameid ||
        (Math.abs(c.latitude - city.latitude) < 0.001 &&
          Math.abs(c.longitude - city.longitude) < 0.001)
    );
  };

  const handleSelect = (city) => {
    if (!city) return;
    if (isCityAlreadySelected(city)) return;
    onAddCity(city);
  };

  // Cities from popular list that are not yet selected
  const availableQuickPicks = POPULAR_CITIES.filter(
    (pop) => !selectedCities.some((c) => c.geonameid === pop.geonameid)
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Selected Locations
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Select 2 to 5 Indian cities to compare real-time air quality metrics and historical trends side-by-side.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedCities.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-medium text-gray-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-red-200 transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            type="button"
            onClick={onResetDefault}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset default
          </button>
        </div>
      </div>

      {/* City Autocomplete Search Bar */}
      <div className="max-w-xl">
        <CityAutocomplete
          onCitySelect={handleSelect}
          placeholder="Search and add another city (e.g., Pune, Hyderabad, Lucknow)..."
          clearOnSelect={true}
        />
      </div>

      {/* Selected City Badges / Chips */}
      <div>
        {selectedCities.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                No cities selected
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Use the search bar above or click quick-add suggestions below to add cities for comparison.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5 items-center">
            {selectedCities.map((city, index) => {
              const color = getCityColor(index);
              return (
                <div
                  key={city.geonameid || `${city.latitude}_${city.longitude}`}
                  className="group inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl border border-gray-200 bg-white shadow-xs hover:border-gray-300 transition-all"
                  style={{ borderLeftWidth: '4px', borderLeftColor: color }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div className="text-left">
                    <span className="text-xs font-semibold text-gray-900">
                      {formatCityName(city.name)}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-1.5">
                      {city.state}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveCity(city.geonameid)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md p-1 transition-colors"
                    aria-label={`Remove ${city.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Picks */}
      {availableQuickPicks.length > 0 && selectedCities.length < 5 && (
        <div className="flex items-center flex-wrap gap-1.5 pt-1 text-xs text-gray-500">
          <span className="font-medium text-gray-400">Quick add:</span>
          {availableQuickPicks.map((city) => (
            <button
              key={city.geonameid}
              type="button"
              onClick={() => handleSelect(city)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-150 transition-colors"
            >
              <Plus className="w-3 h-3 text-gray-400" />
              <span>{city.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
