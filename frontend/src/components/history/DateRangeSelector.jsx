import { useState } from 'react';
import { Calendar, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import {
  getMaxAllowedEndDate,
  getDefaultHistoricalRange,
  validateDateRange,
} from '../../lib/historyUtils';

/**
 * DateRangeSelector
 *
 * Section 2: Date range selector
 * - Presets for 7, 14, 30 days
 * - Start & end date selection with real-time validation
 * - Restricts interval to Google API maximum 30 days
 * - Prevents start >= end and future end dates
 * - Displays and interprets in IST
 */
export default function DateRangeSelector({
  startDate,
  endDate,
  onDateChange,
  activePreset,
  onPresetChange,
}) {
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);
  const [validationError, setValidationError] = useState(null);

  const maxAllowedEnd = getMaxAllowedEndDate();

  const handlePresetClick = (days) => {
    const range = getDefaultHistoricalRange(days);
    setCustomStart(range.startDate);
    setCustomEnd(range.endDate);
    setValidationError(null);
    onPresetChange(days, range);
  };

  const handleStartChange = (e) => {
    const newStart = e.target.value;
    setCustomStart(newStart);
    validateAndPropagate(newStart, customEnd);
  };

  const handleEndChange = (e) => {
    const newEnd = e.target.value;
    setCustomEnd(newEnd);
    validateAndPropagate(customStart, newEnd);
  };

  const validateAndPropagate = (start, end) => {
    if (!start || !end) {
      setValidationError('Please select both start and end dates.');
      return;
    }

    const result = validateDateRange(start, end);
    if (!result.isValid) {
      setValidationError(result.error);
    } else {
      setValidationError(null);
      onDateChange(start, end);
    }
  };

  // Synchronize internal inputs if external props change (e.g. preset clicked)
  if (startDate !== customStart && !validationError) {
    setCustomStart(startDate);
  }
  if (endDate !== customEnd && !validationError) {
    setCustomEnd(endDate);
  }

  // Calculate day difference for active valid range
  const currentDiff = validateDateRange(startDate, endDate).diffDays;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              2
            </span>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Historical Observation Interval
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-8">
            Choose an observation window up to 30 days (Google Air Quality API maximum).
          </p>
        </div>

        {/* IST notice badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200/80 text-xs text-gray-600 self-start lg:self-auto">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Interpreted & displayed in <strong>IST (UTC+05:30)</strong></span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-gray-100">
        {/* Preset quick buttons */}
        <div className="flex items-center gap-1.5 bg-gray-100/80 p-1.5 rounded-xl self-start">
          <button
            type="button"
            onClick={() => handlePresetClick(7)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePreset === 7
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Past 7 Days
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick(14)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePreset === 14
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Past 14 Days
          </button>
          <button
            type="button"
            onClick={() => handlePresetClick(30)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePreset === 30
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Past 30 Days (Max)
          </button>
        </div>

        {/* Custom Start / End Date pickers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Start Date
                </span>
                <input
                  type="date"
                  value={customStart}
                  max={customEnd || maxAllowedEnd}
                  onChange={handleStartChange}
                  className="bg-transparent border-none text-xs text-gray-800 font-semibold focus:outline-none p-0 cursor-pointer"
                  title="Start Date"
                />
              </div>

              <span className="text-gray-400 font-bold px-1">→</span>

              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  End Date
                </span>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={maxAllowedEnd}
                  onChange={handleEndChange}
                  className="bg-transparent border-none text-xs text-gray-800 font-semibold focus:outline-none p-0 cursor-pointer"
                  title="End Date"
                />
              </div>
            </div>
          </div>

          {!validationError && currentDiff > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {currentDiff} {currentDiff === 1 ? 'day' : 'days'}
            </span>
          )}
        </div>
      </div>

      {/* Validation alert banner */}
      {validationError && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
