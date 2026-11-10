import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ArrowLeftRight, RefreshCw } from 'lucide-react';

import Navbar from '../components/Navbar';
import CitySelectorSection from '../components/comparison/CitySelectorSection';
import ComparisonSummaryCards from '../components/comparison/ComparisonSummaryCards';
import AqiComparisonChart from '../components/comparison/AqiComparisonChart';
import PollutantComparisonChart from '../components/comparison/PollutantComparisonChart';
import HistoricalAqiChart from '../components/comparison/HistoricalAqiChart';
import HistoricalPollutantChart from '../components/comparison/HistoricalPollutantChart';
import AirQualityVerdict from '../components/comparison/AirQualityVerdict';

import { getCurrentConditions, getHistory } from '../api/airQuality';
import {
  DEFAULT_SELECTED_CITIES,
  getDefaultHistoricalRange,
} from '../lib/comparisonUtils';

/**
 * LocationComparison Page (Page 3)
 *
 * Implements full location comparison for multiple Indian cities:
 * - Multi-city selection backed by SQLite autocomplete
 * - 1 current-conditions request per city (all pollutants & AQI indexes in a single response)
 * - 1 historical request per city using the exact same shared time window (<= 30 days)
 * - Sections displayed in strict required order:
 *     A. Summary card
 *     B. AQI comparison chart
 *     C. Pollutant-wise comparison chart
 *     D. Historical AQI comparison
 *     E. Historical pollutant comparison
 *     F. Better air quality identification
 */
export default function LocationComparison() {
  // -------------------------------------------------------------------------
  // Selected Cities State (retains: geonameid, name, state, latitude, longitude)
  // -------------------------------------------------------------------------
  const [selectedCities, setSelectedCities] = useState(DEFAULT_SELECTED_CITIES);

  // -------------------------------------------------------------------------
  // Shared Historical Interval State (All cities use the exact same dates)
  // -------------------------------------------------------------------------
  const [activePreset, setActivePreset] = useState(7);
  const [{ startDate, endDate }, setDateRange] = useState(() =>
    getDefaultHistoricalRange(7)
  );

  const handlePresetChange = (days) => {
    setActivePreset(days);
    setDateRange(getDefaultHistoricalRange(days));
  };

  const handleCustomDateChange = (newStart, newEnd) => {
    setActivePreset(null);
    setDateRange({ startDate: newStart, endDate: newEnd });
  };

  // -------------------------------------------------------------------------
  // City Management Handlers
  // -------------------------------------------------------------------------
  const handleAddCity = (city) => {
    if (!city) return;
    // Retain only required fields: geonameid, name, state, latitude, longitude
    const cleanCity = {
      geonameid: city.geonameid,
      name: city.name,
      state: city.state,
      latitude: city.latitude,
      longitude: city.longitude,
    };
    setSelectedCities((prev) => [...prev, cleanCity]);
  };

  const handleRemoveCity = (geonameid) => {
    setSelectedCities((prev) => prev.filter((c) => c.geonameid !== geonameid));
  };

  const handleClearAll = () => {
    setSelectedCities([]);
  };

  const handleResetDefault = () => {
    setSelectedCities(DEFAULT_SELECTED_CITIES);
  };

  // -------------------------------------------------------------------------
  // TanStack Query: Current Conditions (1 request per city, cached)
  // -------------------------------------------------------------------------
  const currentQueries = useQueries({
    queries: selectedCities.map((city) => ({
      queryKey: ['airQuality', 'current', city.latitude, city.longitude],
      queryFn: () => getCurrentConditions(city.latitude, city.longitude),
      staleTime: 10 * 60 * 1000, // 10 minutes cache
      retry: 2,
      enabled: Boolean(city.latitude != null && city.longitude != null),
    })),
  });

  // -------------------------------------------------------------------------
  // TanStack Query: Historical Conditions (1 request per city for shared window, cached)
  // -------------------------------------------------------------------------
  const historyQueries = useQueries({
    queries: selectedCities.map((city) => ({
      queryKey: [
        'airQuality',
        'history',
        city.latitude,
        city.longitude,
        startDate,
        endDate,
      ],
      queryFn: () =>
        getHistory(city.latitude, city.longitude, startDate, endDate),
      staleTime: 30 * 60 * 1000, // 30 minutes cache
      retry: 2,
      enabled: Boolean(
        city.latitude != null &&
          city.longitude != null &&
          startDate &&
          endDate
      ),
    })),
  });

  const handleRefreshAll = () => {
    currentQueries.forEach((q) => q.refetch());
    historyQueries.forEach((q) => q.refetch());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        rightContent={
          <button
            type="button"
            onClick={handleRefreshAll}
            className="flex items-center justify-center p-2 rounded-xl text-gray-700 bg-slate-100/90 hover:bg-slate-200/90 transition-colors"
            title="Refresh air quality data"
            aria-label="Refresh air quality data"
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" />
          </button>
        }
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-8 pb-20">
        {/* Page Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wide mb-2">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Location Comparison
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Compare Air Quality Across Cities
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Select multiple Indian cities to evaluate real-time pollution metrics, historical trends, and determine where the air is cleaner.
            </p>
          </div>

          {/* Desktop Refresh Button (placed here so header is not affected) */}
          <button
            type="button"
            onClick={handleRefreshAll}
            className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 shadow-xs hover:bg-gray-50 hover:border-gray-300 transition-all self-start sm:self-center flex-shrink-0"
            title="Refresh air quality data"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* 1. Multi-City Autocomplete Selection */}
        <CitySelectorSection
          selectedCities={selectedCities}
          onAddCity={handleAddCity}
          onRemoveCity={handleRemoveCity}
          onClearAll={handleClearAll}
          onResetDefault={handleResetDefault}
        />

        {/* Required Sections in Strict Order: A -> B -> C -> D -> E -> F */}
        {selectedCities.length > 0 && (
          <div className="space-y-5 sm:space-y-8">
            {/* Section A: Summary Card */}
            <ComparisonSummaryCards
              selectedCities={selectedCities}
              currentQueries={currentQueries}
              onRemoveCity={handleRemoveCity}
            />

            {/* Section B: AQI Comparison Chart */}
            <AqiComparisonChart
              selectedCities={selectedCities}
              currentQueries={currentQueries}
            />

            {/* Section C: Pollutant-Wise Comparison Chart */}
            <PollutantComparisonChart
              selectedCities={selectedCities}
              currentQueries={currentQueries}
            />

            {/* Section D: Historical AQI Comparison */}
            <HistoricalAqiChart
              selectedCities={selectedCities}
              historyQueries={historyQueries}
              startDate={startDate}
              endDate={endDate}
              onPresetChange={handlePresetChange}
              activePreset={activePreset}
              onCustomDateChange={handleCustomDateChange}
            />

            {/* Section E: Historical Pollutant Comparison */}
            <HistoricalPollutantChart
              selectedCities={selectedCities}
              historyQueries={historyQueries}
              startDate={startDate}
              endDate={endDate}
            />

            {/* Section F: Better Air Quality Identification */}
            <AirQualityVerdict
              selectedCities={selectedCities}
              currentQueries={currentQueries}
            />
          </div>
        )}
      </main>
    </div>
  );
}
