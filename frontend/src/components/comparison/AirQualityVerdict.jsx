import { Award, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { cn, formatCityName, getAqiColors } from '../../lib/utils';
import { getCityColor } from '../../lib/comparisonUtils';

/**
 * Section F: Better Air Quality Identification
 *
 * Identifies which city currently has better air quality using a comparable AQI scale
 * (preferably `ind_cpcb` 0–500 scale, where lower is better).
 *
 * If comparable AQI values are unavailable or scales are incompatible, clearly explains
 * that a reliable comparison cannot be established and refuses to infer a false ranking.
 */
export default function AirQualityVerdict({
  selectedCities,
  currentQueries,
}) {
  if (selectedCities.length === 0) return null;

  if (selectedCities.length === 1) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 text-center space-y-2">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <HelpCircle className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-gray-900">
          Add at least 2 cities for head-to-head comparison
        </h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          Only one location is currently selected. Add another city using the search box above to determine which location has better air quality.
        </p>
      </div>
    );
  }

  // Check if any query is loading
  const isLoading = currentQueries.some((q) => q.isLoading);
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-xs text-gray-500">
        Evaluating air quality metrics across selected locations…
      </div>
    );
  }

  // Extract cities' AQI profiles
  const cityProfiles = selectedCities.map((city, index) => {
    const query = currentQueries[index];
    const data = query?.data?.data;
    const cpcb = data?.aqi?.find((a) => a.code === 'ind_cpcb');
    const uaqi = data?.aqi?.find((a) => a.code === 'uaqi');
    const firstAqi = data?.aqi?.[0];

    return {
      id: city.geonameid,
      cityName: formatCityName(city.name),
      state: city.state,
      color: getCityColor(index),
      cpcb: cpcb?.aqi != null ? cpcb : null,
      uaqi: uaqi?.aqi != null ? uaqi : null,
      fallbackAqi: firstAqi,
      hasError: query?.isError || !data,
    };
  });

  // Check error state
  const errorCities = cityProfiles.filter((c) => c.hasError);
  if (errorCities.length > 0) {
    return (
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-2 text-amber-900">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          Comparison Cannot Be Established Reliably
        </div>
        <p className="text-xs text-amber-800">
          Air quality data could not be retrieved for {errorCities.map((c) => c.cityName).join(', ')}.
          A fair ranking cannot be computed until data for all selected locations is loaded.
        </p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Verify Scale Compatibility
  // -------------------------------------------------------------------------
  const allHaveCpcb = cityProfiles.every((c) => c.cpcb && typeof c.cpcb.aqi === 'number');
  const allHaveUaqi = cityProfiles.every((c) => c.uaqi && typeof c.uaqi.aqi === 'number');

  let scaleUsed = null;
  let rankedCities = [];

  if (allHaveCpcb) {
    scaleUsed = {
      code: 'ind_cpcb',
      name: 'India National AQI (CPCB)',
      range: '0 to 500 (Lower is better)',
    };
    // Sort ascending: lower AQI = better air quality
    rankedCities = [...cityProfiles].sort((a, b) => a.cpcb.aqi - b.cpcb.aqi).map((c) => ({
      ...c,
      activeAqi: c.cpcb.aqi,
      category: c.cpcb.category,
      dominantPollutant: c.cpcb.dominantPollutant,
    }));
  } else if (allHaveUaqi) {
    scaleUsed = {
      code: 'uaqi',
      name: 'Universal AQI (UAQI)',
      range: '0 to 100 (Standardized)',
    };
    // Sort ascending: lower is better
    rankedCities = [...cityProfiles].sort((a, b) => a.uaqi.aqi - b.uaqi.aqi).map((c) => ({
      ...c,
      activeAqi: c.uaqi.aqi,
      category: c.uaqi.category,
      dominantPollutant: c.uaqi.dominantPollutant,
    }));
  } else {
    // INCOMPATIBLE SCALES: Refuse to infer ranking
    return (
      <div className="bg-rose-50 rounded-2xl border border-rose-200 p-5 sm:p-6 space-y-3 text-rose-950">
        <div className="flex items-center gap-2 font-bold text-sm text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>F. Better Air Quality Identification — Incompatible Scales</span>
        </div>
        <p className="text-xs text-rose-900 leading-relaxed">
          <strong>A reliable comparison cannot be established.</strong> The selected cities do not
          report air quality metrics on a shared, compatible AQI scale. Some locations provide the
          India CPCB scale (0–500) while others only report Universal AQI (0–100) or local provincial indexes.
        </p>
        <p className="text-xs text-rose-800">
          To maintain scientific integrity and prevent misleading conclusions, rankings are never inferred
          across incompatible index scales.
        </p>

        {/* Breakdown of detected scales */}
        <div className="pt-2">
          <p className="text-[11px] font-semibold text-rose-900 mb-1.5 uppercase tracking-wide">
            Reported scales per location:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {cityProfiles.map((c) => (
              <div key={c.id} className="bg-white/80 p-2.5 rounded-lg border border-rose-100 flex items-center justify-between">
                <span className="font-semibold text-gray-900">{c.cityName}</span>
                <span className="text-[11px] text-gray-600">
                  {c.cpcb ? 'CPCB (0–500)' : c.uaqi ? 'UAQI (0–100)' : 'No recognized index'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Best city is rank #1
  const bestCity = rankedCities[0];
  const worstCity = rankedCities[rankedCities.length - 1];
  const aqiDiff = worstCity.activeAqi - bestCity.activeAqi;
  const bestColors = getAqiColors(scaleUsed.code, bestCity.activeAqi);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            F. Air Quality Verdict & Ranking
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Scientific head-to-head evaluation based on comparable {scaleUsed.name} values.
          </p>
        </div>

        <div className="text-xs px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100 font-medium">
          Comparable Scale: {scaleUsed.name} ({scaleUsed.range})
        </div>
      </div>

      {/* Hero Verdict Card */}
      <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl border border-emerald-200/80 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Cleanest Air Among Compared Locations
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {bestCity.cityName}
            <span className="text-base font-normal text-gray-500 ml-2">
              ({bestCity.state})
            </span>
          </h3>

          <p className="text-sm text-gray-700 leading-relaxed max-w-xl">
            <strong>{bestCity.cityName}</strong> currently enjoys the best air quality among selected cities
            with an AQI of <strong>{bestCity.activeAqi}</strong> ({bestCity.category}).
            {aqiDiff > 0 && (
              <>
                {' '}This is{' '}
                <span className="font-semibold text-emerald-700">
                  {aqiDiff} AQI points cleaner
                </span>{' '}
                than {worstCity.cityName} ({worstCity.activeAqi}, {worstCity.category}).
              </>
            )}
          </p>
        </div>

        {/* Winner AQI Score Badge */}
        <div className="flex md:flex-col items-center justify-center p-4 bg-white/90 rounded-2xl border border-emerald-200 shadow-sm flex-shrink-0 min-w-32 text-center">
          <span className={cn('text-4xl font-black leading-none', bestColors.text)}>
            {bestCity.activeAqi}
          </span>
          <span className="text-xs font-bold text-gray-700 mt-1 uppercase">
            {bestCity.category}
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5">
            {scaleUsed.code === 'ind_cpcb' ? 'CPCB Index' : 'UAQI'}
          </span>
        </div>
      </div>

      {/* Complete Ranked Standings List */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Ranked Comparison (Cleanest to Most Polluted)
        </h4>

        <div className="space-y-2">
          {rankedCities.map((city, rankIdx) => {
            const colors = getAqiColors(scaleUsed.code, city.activeAqi);
            const deltaFromBest = city.activeAqi - bestCity.activeAqi;

            return (
              <div
                key={city.id}
                className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/60 transition-colors shadow-xs"
              >
                {/* Rank & City Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                      rankIdx === 0
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    #{rankIdx + 1}
                  </span>

                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: city.color }}
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {city.cityName}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {city.state}
                      {city.dominantPollutant && (
                        <span> • Dominant: <strong className="uppercase">{city.dominantPollutant}</strong></span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Score & Category */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {rankIdx > 0 && (
                    <span className="text-xs text-amber-600 font-semibold hidden sm:inline-block">
                      +{deltaFromBest} pts
                    </span>
                  )}
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-bold',
                      colors.bg,
                      colors.text
                    )}
                  >
                    AQI {city.activeAqi} • {city.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-gray-400 pt-1">
        Evaluation strictly uses official {scaleUsed.name} figures. Lower values denote lower pollutant concentrations and fewer adverse health risks.
      </p>
    </div>
  );
}
