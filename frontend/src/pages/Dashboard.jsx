import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Navigation, MapPin, AlertCircle, X } from 'lucide-react';

import { useGeolocation } from '../hooks/useGeolocation';
import { getCurrentConditions, getForecast } from '../api/airQuality';
import { POPULAR_HISTORY_CITIES } from '../lib/historyUtils';

import LocationHeader from '../components/dashboard/LocationHeader';
import TimestampBar from '../components/dashboard/TimestampBar';
import AqiSummaryCard from '../components/dashboard/AqiSummaryCard';
import PollutantGrid from '../components/dashboard/PollutantGrid';
import HealthAdvisory from '../components/dashboard/HealthAdvisory';
import ForecastSection from '../components/dashboard/ForecastSection';
import LoadingSkeleton from '../components/dashboard/LoadingSkeleton';
import ErrorState from '../components/dashboard/ErrorState';
import CityAutocomplete from '../components/CityAutocomplete';
import Navbar from '../components/Navbar';

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const { detectLocation } = useGeolocation();

  // Active location mode: 'current' | 'city' | null
  const [locationMode, setLocationMode] = useState(null);

  // Selected city object from CityAutocomplete (has latitude, longitude, name, state)
  const [selectedCity, setSelectedCity] = useState(null);

  // Current GPS / network coordinates resolved from device
  const [currentLocationCoords, setCurrentLocationCoords] = useState(null);

  // Geolocation detection status
  const [isLocating, setIsLocating] = useState(true);
  const [isInitialLocating, setIsInitialLocating] = useState(true);
  const [locationError, setLocationError] = useState(null);

  // UI state for city search input highlighting
  const [isCityHighlighted, setIsCityHighlighted] = useState(false);
  const cityInputRef = useRef(null);

  // Ref to track if user explicitly selected a city while initial GPS was in-flight
  const userSelectedCityRef = useRef(false);

  // -------------------------------------------------------------------------
  // Resolve active coordinates and location label
  // -------------------------------------------------------------------------

  const coords =
    locationMode === 'city' && selectedCity != null
      ? { latitude: selectedCity.latitude, longitude: selectedCity.longitude }
      : locationMode === 'current' && currentLocationCoords != null
      ? currentLocationCoords
      : null;

  const locationLabel =
    locationMode === 'city' && selectedCity != null
      ? { name: selectedCity.name, state: selectedCity.state, isCurrent: false }
      : locationMode === 'current' && currentLocationCoords != null
      ? { name: 'Your Location', state: null, isCurrent: true }
      : null;

  // Display 'Use current location' button ONLY when the data generated is NOT that of current location
  const showCurrentLocationButton = !(locationMode === 'current' && coords != null);

  // -------------------------------------------------------------------------
  // Initial page entry: ask for location (GPS + fallback)
  // -------------------------------------------------------------------------

  useEffect(() => {
    let isCancelled = false;

    detectLocation().then((result) => {
      if (isCancelled) return;
      setIsInitialLocating(false);
      setIsLocating(false);

      // If user already manually selected a city before GPS finished, keep user's selection
      if (userSelectedCityRef.current) return;

      if (result.success && result.coords) {
        setLocationMode('current');
        setCurrentLocationCoords(result.coords);
        setLocationError(null);
        setIsCityHighlighted(false);
      } else {
        const errorMsg =
          result.error ||
          'Could not detect your location automatically. Please search and select your city above.';
        setLocationError(errorMsg);

        // Highlight and focus the city selection input
        setIsCityHighlighted(true);
        setTimeout(() => {
          cityInputRef.current?.focus();
        }, 50);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [detectLocation]);

  // -------------------------------------------------------------------------
  // Handlers: City selection & Use current location button
  // -------------------------------------------------------------------------

  function handleCitySelect(city) {
    if (city) {
      userSelectedCityRef.current = true;
      setSelectedCity(city);
      setLocationMode('city');
      setLocationError(null);
      setIsCityHighlighted(false);
    } else {
      setSelectedCity(null);
      if (locationMode === 'city') {
        setLocationMode(null);
      }
    }
  }

  async function handleUseCurrentLocation() {
    setIsLocating(true);
    setLocationError(null);
    setIsCityHighlighted(false);

    const result = await detectLocation();
    setIsLocating(false);

    if (result.success && result.coords) {
      userSelectedCityRef.current = false;
      setSelectedCity(null); // Clear city input since we switched to current location
      setCurrentLocationCoords(result.coords);
      setLocationMode('current');
      setLocationError(null);
      setIsCityHighlighted(false);
    } else {
      const errorMsg =
        result.error ||
        'Could not detect your current location. Please verify browser permissions or search for your city.';
      setLocationError(errorMsg);

      // If already some data is there, let it be in that state!
      // Else highlight city input box for city selection.
      if (!coords) {
        setIsCityHighlighted(true);
        cityInputRef.current?.focus();
      }
    }
  }

  // -------------------------------------------------------------------------
  // TanStack Query — current conditions
  // -------------------------------------------------------------------------

  const currentQuery = useQuery({
    queryKey: ['airQuality', 'current', coords?.latitude, coords?.longitude],
    queryFn: () => getCurrentConditions(coords.latitude, coords.longitude),
    enabled: coords != null,
    staleTime: 10 * 60 * 1000, // 10 min — data refreshes hourly
    retry: 2,
  });

  // -------------------------------------------------------------------------
  // TanStack Query — 96-hour forecast
  // -------------------------------------------------------------------------

  const forecastQuery = useQuery({
    queryKey: ['airQuality', 'forecast', coords?.latitude, coords?.longitude],
    queryFn: () => getForecast(coords.latitude, coords.longitude),
    enabled: coords != null,
    staleTime: 30 * 60 * 1000, // 30 min
    retry: 2,
  });

  const currentData = currentQuery.data?.data ?? null;
  const forecastData = forecastQuery.data?.data ?? null;

  const currentErrorMsg =
    currentQuery.error?.response?.data?.error?.message ||
    'Failed to load air quality data. Please try again.';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ------------------------------------------------------------------ */}
      {/* Sticky top navigation header (no change location button needed) */}
      {/* ------------------------------------------------------------------ */}
      <Navbar />

      {/* ------------------------------------------------------------------ */}
      {/* Main dashboard content */}
      {/* ------------------------------------------------------------------ */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-16">

        {/* ---------------------------------------------------------------- */}
        {/* Top Section: City Selection & Location Controls                 */}
        {/* ---------------------------------------------------------------- */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
          {/* Notification / Error message banner (if location detection failed) */}
          {locationError && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start justify-between gap-3 text-xs sm:text-sm animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800">Location Notice</p>
                  <p className="text-amber-700 mt-0.5">{locationError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLocationError(null)}
                className="text-amber-500 hover:text-amber-700 p-1 rounded-md transition-colors focus:outline-none"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* City Selection on top of dashboard */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="dashboard-city-search"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                City Selection
              </label>
              {isCityHighlighted && (
                <span className="text-[11px] font-medium text-blue-600 animate-pulse">
                  Please select your city to continue
                </span>
              )}
            </div>

            <CityAutocomplete
              selectedCity={selectedCity}
              onCitySelect={handleCitySelect}
              placeholder="Search for an Indian city (e.g. Mumbai, Delhi, Bengaluru)..."
              isHighlighted={isCityHighlighted}
              inputRef={cityInputRef}
              onFocus={() => setIsCityHighlighted(false)}
            />
          </div>

          {/* Use current location button below city selection */}
          {/* Displayed ONLY when the data generated is NOT that of current location */}
          {showCurrentLocationButton && (
            <div className="pt-1 flex items-center justify-between flex-wrap gap-3">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>
                  {isLocating ? 'Detecting your location…' : 'Use current location'}
                </span>
              </button>

              {isLocating && (
                <span className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                  Checking GPS & network positioning…
                </span>
              )}
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Location Air Quality Data Region                                 */}
        {/* ---------------------------------------------------------------- */}
        {!coords ? (
          /* Empty or Initial Detecting state */
          isInitialLocating ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Detecting your location…</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Attempting GPS and network positioning to fetch live local air quality data.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                <MapPin className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Select a location to see air quality data
              </h3>
              <p className="text-sm text-gray-500 mt-1.5 max-w-md mx-auto">
                Search for an Indian city above or click &ldquo;Use current location&rdquo; to view real-time AQI, pollutant breakdown, and health recommendations.
              </p>

              {/* Quick Select Popular Cities */}
              <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-medium text-gray-400 mr-1">Popular cities:</span>
                {POPULAR_HISTORY_CITIES.map((city) => (
                  <button
                    key={city.geonameid}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className="text-xs font-medium text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200/80 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{city.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        ) : (
          /* Live Air Quality Data */
          <div className="space-y-5">
            {/* Location header */}
            <LocationHeader location={locationLabel} />

            {/* Current conditions */}
            {currentQuery.isLoading && <LoadingSkeleton />}

            {currentQuery.isError && (
              <ErrorState
                message={currentErrorMsg}
                onRetry={() => currentQuery.refetch()}
              />
            )}

            {currentData && (
              <>
                {/* Timestamp / freshness bar */}
                <TimestampBar timestamp={currentData.timestamp} />

                {/* AQI summary (uaqi + ind_cpcb) */}
                <AqiSummaryCard aqi={currentData.aqi} />

                {/* Individual pollutant cards */}
                <PollutantGrid pollutants={currentData.pollutants} />

                {/* Health advisory */}
                <HealthAdvisory recommendations={currentData.healthRecommendations} />
              </>
            )}

            {/* Forecast (independent query — renders separately) */}
            <ForecastSection
              forecast={forecastData?.forecast}
              isLoading={forecastQuery.isLoading}
              isError={forecastQuery.isError}
              onRetry={() => forecastQuery.refetch()}
            />
          </div>
        )}
      </main>
    </div>
  );
}
