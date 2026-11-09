import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { useGeolocation } from '../hooks/useGeolocation';
import { getCurrentConditions, getForecast } from '../api/airQuality';

import LocationHeader from '../components/dashboard/LocationHeader';
import TimestampBar from '../components/dashboard/TimestampBar';
import AqiSummaryCard from '../components/dashboard/AqiSummaryCard';
import PollutantGrid from '../components/dashboard/PollutantGrid';
import HealthAdvisory from '../components/dashboard/HealthAdvisory';
import ForecastSection from '../components/dashboard/ForecastSection';
import LoadingSkeleton from '../components/dashboard/LoadingSkeleton';
import ErrorState from '../components/dashboard/ErrorState';
import LocationPermissionPrompt from '../components/dashboard/LocationPermissionPrompt';
import Navbar from '../components/Navbar';

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function Dashboard() {
  const geo = useGeolocation();

  /**
   * selectedCity — city object from CityAutocomplete (has latitude, longitude, name, state)
   * showCityPicker — forces the city picker overlay regardless of GPS status
   */
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCityPicker, setShowCityPicker] = useState(false);

  // -------------------------------------------------------------------------
  // Resolve active coordinates and display name
  // -------------------------------------------------------------------------

  const coords =
    selectedCity != null
      ? { latitude: selectedCity.latitude, longitude: selectedCity.longitude }
      : geo.status === 'granted' && geo.coords != null
      ? geo.coords
      : null;

  const locationLabel =
    selectedCity != null
      ? { name: selectedCity.name, state: selectedCity.state }
      : geo.status === 'granted'
      ? { name: 'Your Location', state: null }
      : null;

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

  // -------------------------------------------------------------------------
  // Render: GPS requesting
  // -------------------------------------------------------------------------

  if (geo.status === 'requesting' && selectedCity == null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
          <p className="text-sm font-medium text-gray-700">Detecting your location…</p>
          <p className="text-xs text-gray-400 mt-1">This may take a moment</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: city picker (no coords yet, or user requested change)
  // -------------------------------------------------------------------------

  const needsLocation =
    coords == null &&
    (geo.status === 'denied' ||
      geo.status === 'unavailable' ||
      geo.status === 'idle');

  if (needsLocation || showCityPicker) {
    return (
      <LocationPermissionPrompt
        geoStatus={geo.status}
        onCitySelect={(city) => {
          if (city) {
            setSelectedCity(city);
            setShowCityPicker(false);
          }
        }}
      />
    );
  }

  // -------------------------------------------------------------------------
  // Render: main dashboard
  // -------------------------------------------------------------------------

  const currentData = currentQuery.data?.data ?? null;
  const forecastData = forecastQuery.data?.data ?? null;

  const currentErrorMsg =
    currentQuery.error?.response?.data?.error?.message ||
    'Failed to load air quality data. Please try again.';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ------------------------------------------------------------------ */}
      {/* Sticky header */}
      {/* ------------------------------------------------------------------ */}
      <Navbar
        rightContent={
          <button
            onClick={() => setShowCityPicker(true)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Change location
          </button>
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Main content */}
      {/* ------------------------------------------------------------------ */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-16">

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
        {/* Use query.isLoading (= isPending && isFetching) — the same flag used
            for the current-conditions skeleton above. This ensures the skeleton
            is only visible while a fetch is actively in-flight. Using isPending
            alone keeps the skeleton showing during retry cool-down windows and
            in between failed attempts, so the user is stuck in permanent
            skeleton state until all retries exhaust. isFetching alone would
            flash the skeleton again on background refetches of cached data.
            isLoading = isPending && isFetching is exactly right: first fetch
            only, actively in-flight.                                           */}
        {coords != null && (
          <ForecastSection
            forecast={forecastData?.forecast}
            isLoading={forecastQuery.isLoading}
            isError={forecastQuery.isError}
            onRetry={() => forecastQuery.refetch()}
          />
        )}
      </main>
    </div>
  );
}
