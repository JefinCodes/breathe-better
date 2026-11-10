import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, RefreshCw, AlertCircle } from 'lucide-react';

import Navbar from '../components/Navbar';
import CitySelectorSection from '../components/history/CitySelectorSection';
import DateRangeSelector from '../components/history/DateRangeSelector';
import HistoricalSummaryCards from '../components/history/HistoricalSummaryCards';
import HistoricalAqiChart from '../components/history/HistoricalAqiChart';
import PollutantSelector from '../components/history/PollutantSelector';
import PollutantTrendChart from '../components/history/PollutantTrendChart';

import { getHistory } from '../api/airQuality';
import {
  DEFAULT_HISTORY_CITY,
  getDefaultHistoricalRange,
  processHistoricalObservations,
  validateDateRange,
} from '../lib/historyUtils';

/**
 * HistoricalTracker Page (Page 4)
 *
 * Implements Stage 6: Historical Pollution Tracker
 * 1. City selector (SQLite autocomplete backed, stored lat/lon, no arbitrary names)
 * 2. Date range selector (up to 30 days max, validation, IST timestamps, single API call)
 * 3. Historical AQI chart (hourly Recharts, IST timestamps, connectNulls={false})
 * 4. Pollutant trends (PM2.5, PM10, NO2, SO2, CO, O3, available only, dynamic units, zero extra calls)
 * 5. Summary statistics (Avg, Max, Min, Available count, excludes missing data, consistent scale)
 * 6. UI design (White-background responsive design, Tailwind, Recharts, Lucide React)
 * 7. State and API (TanStack Query, caching, deduplication, auto-invalidation)
 */
export default function HistoricalTracker() {
  // -------------------------------------------------------------------------
  // 1. City selection state
  // -------------------------------------------------------------------------
  const [selectedCity, setSelectedCity] = useState(DEFAULT_HISTORY_CITY);

  // -------------------------------------------------------------------------
  // 2. Date range state
  // -------------------------------------------------------------------------
  const [activePreset, setActivePreset] = useState(7);
  const [{ startDate, endDate }, setDateRange] = useState(() =>
    getDefaultHistoricalRange(7)
  );

  // -------------------------------------------------------------------------
  // 3. Selected pollutant state
  // -------------------------------------------------------------------------
  const [selectedPollutant, setSelectedPollutant] = useState('pm25');

  // Handlers for date changes
  const handlePresetChange = (days, range) => {
    setActivePreset(days);
    setDateRange(range);
  };

  const handleCustomDateChange = (start, end) => {
    setActivePreset(null);
    setDateRange({ startDate: start, endDate: end });
  };

  // -------------------------------------------------------------------------
  // 4. TanStack Query for Historical Air Quality Data
  // Single merged endpoint providing all AQI indexes and all pollutants
  // -------------------------------------------------------------------------
  const dateValidation = validateDateRange(startDate, endDate);
  const isQueryEnabled = Boolean(
    selectedCity?.latitude != null &&
      selectedCity?.longitude != null &&
      dateValidation.isValid
  );

  const historyQuery = useQuery({
    queryKey: [
      'airQuality',
      'history',
      selectedCity?.latitude,
      selectedCity?.longitude,
      startDate,
      endDate,
    ],
    queryFn: () =>
      getHistory(
        selectedCity.latitude,
        selectedCity.longitude,
        startDate,
        endDate
      ),
    enabled: isQueryEnabled,
    staleTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 2,
  });

  // -------------------------------------------------------------------------
  // 5. Process historical observations & calculate statistics
  // -------------------------------------------------------------------------
  const rawObservations = historyQuery.data?.data?.observations;

  const processed = useMemo(() => {
    return processHistoricalObservations(rawObservations || []);
  }, [rawObservations]);

  // Derived selected pollutant code: falls back to first available if current selection is absent
  const activePollutantCode = useMemo(() => {
    if (processed.availablePollutants.length === 0) return selectedPollutant;
    const exists = processed.availablePollutants.some(
      (p) => p.code.toLowerCase() === selectedPollutant.toLowerCase()
    );
    return exists
      ? selectedPollutant
      : processed.availablePollutants[0].code.toLowerCase();
  }, [processed.availablePollutants, selectedPollutant]);

  const activePollutantConfig = useMemo(() => {
    return (
      processed.availablePollutants.find(
        (p) => p.code.toLowerCase() === activePollutantCode.toLowerCase()
      ) || processed.availablePollutants[0]
    );
  }, [processed.availablePollutants, activePollutantCode]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        rightContent={
          <button
            type="button"
            onClick={() => historyQuery.refetch()}
            disabled={historyQuery.isFetching}
            className="flex items-center justify-center p-2 rounded-xl text-gray-700 bg-slate-100/90 hover:bg-slate-200/90 disabled:opacity-50 transition-colors"
            title="Refresh historical data"
            aria-label="Refresh historical data"
          >
            <RefreshCw
              className={`w-4 h-4 text-emerald-600 ${
                historyQuery.isFetching ? 'animate-spin' : ''
              }`}
            />
          </button>
        }
      />

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wide mb-2">
              <History className="w-3.5 h-3.5" />
              Page 4 • Historical Pollution Tracker
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Historical Air Quality &amp; Pollutant Tracker
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Analyze historical hourly AQI trends, track individual pollutant concentrations, and inspect air quality metrics for any verified Indian city.
            </p>
          </div>

          {/* Desktop Refresh Button (placed here so header is not affected) */}
          <button
            type="button"
            onClick={() => historyQuery.refetch()}
            disabled={historyQuery.isFetching}
            className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 shadow-xs hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all self-start sm:self-center flex-shrink-0"
            title="Refresh historical data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-emerald-600 ${
                historyQuery.isFetching ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* 1. City Selector Section */}
        <CitySelectorSection
          selectedCity={selectedCity}
          onCitySelect={setSelectedCity}
        />

        {/* 2. Date Range Selector Section */}
        <DateRangeSelector
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleCustomDateChange}
          activePreset={activePreset}
          onPresetChange={handlePresetChange}
        />

        {/* Query Error State */}
        {historyQuery.isError && (
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>
                {historyQuery.error?.response?.data?.error?.message ||
                  'Failed to fetch historical air quality observations. Please verify your connection and date range.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => historyQuery.refetch()}
              className="px-3 py-1 font-semibold rounded-lg bg-red-100 hover:bg-red-200 text-red-800 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* 5. Summary Statistics Cards */}
        <HistoricalSummaryCards
          stats={processed.stats}
          isLoading={historyQuery.isLoading}
        />

        {/* 3. Historical AQI Chart */}
        <HistoricalAqiChart
          chartData={processed.chartData}
          isLoading={historyQuery.isLoading}
          scaleName={processed.stats.scaleName}
          cityName={selectedCity?.name}
          diffDays={dateValidation.diffDays || 7}
        />

        {/* 4. Pollutant Trends Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    4
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                    Individual Pollutant Trends
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-8">
                  Switch between available pollutants to observe specific concentration trajectories over time.
                </p>
              </div>
            </div>

            {/* Pollutant Selector Switcher */}
            <PollutantSelector
              availablePollutants={processed.availablePollutants}
              selectedPollutant={activePollutantCode}
              onSelectPollutant={setSelectedPollutant}
              pollutantStats={processed.pollutantStats}
            />
          </div>

          {/* Pollutant Trend Chart */}
          <PollutantTrendChart
            chartData={processed.chartData}
            selectedPollutantConfig={activePollutantConfig}
            pollutantStats={processed.pollutantStats}
            diffDays={dateValidation.diffDays || 7}
          />
        </div>
      </main>
    </div>
  );
}
