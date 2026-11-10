import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wind,
  ShieldAlert,
  TrendingUp,
  Activity,
  Clock,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { getCurrentConditions, getForecast } from '../../api/airQuality';

// Hardcoded health advisory texts matching dashboard standards
const HEALTH_ADVISORIES = {
  GOOD: 'Air quality is ideal, with minimal health risks for everyone. Enjoy your day and continue your normal outdoor activities without concern. Natural ventilation by opening windows is encouraged.',
  SATISFACTORY: 'Air quality is generally safe for the public, although unusually sensitive individuals may experience minor breathing discomfort. Routine daily activities can continue with minimal precautions.',
  MODERATE: 'Air quality may cause breathing discomfort among children, older adults, and individuals with existing heart or lung conditions during prolonged exposure. Sensitive groups should avoid strenuous outdoor exertion.',
  POOR: 'Prolonged exposure may cause breathing difficulties even in healthy individuals. Avoid extended outdoor workouts and intense physical activity. Wear an N95 respirator if going outdoors is essential.',
  VERY_POOR: 'Air pollution has reached hazardous levels that can trigger respiratory illnesses. Restrict outdoor physical activities. Sensitive individuals should remain indoors in clean-air spaces with air purification.',
  SEVERE: 'Air quality is at an emergency level that poses extreme risks to all individuals. Avoid all outdoor physical exertion, keep windows closed, and operate indoor air purifiers continuously.',
};

function getAdvisoryParagraph(aqiVal, categoryName) {
  const norm = (categoryName || '').toLowerCase().replace(/[-_]/g, ' ');
  if (norm.includes('good')) return HEALTH_ADVISORIES.GOOD;
  if (norm.includes('satisfactory')) return HEALTH_ADVISORIES.SATISFACTORY;
  if (norm.includes('moderate')) return HEALTH_ADVISORIES.MODERATE;
  if (norm.includes('very poor')) return HEALTH_ADVISORIES.VERY_POOR;
  if (norm.includes('poor')) return HEALTH_ADVISORIES.POOR;
  if (norm.includes('severe')) return HEALTH_ADVISORIES.SEVERE;

  if (aqiVal != null && !isNaN(aqiVal)) {
    if (aqiVal <= 50) return HEALTH_ADVISORIES.GOOD;
    if (aqiVal <= 100) return HEALTH_ADVISORIES.SATISFACTORY;
    if (aqiVal <= 200) return HEALTH_ADVISORIES.MODERATE;
    if (aqiVal <= 300) return HEALTH_ADVISORIES.POOR;
    if (aqiVal <= 400) return HEALTH_ADVISORIES.VERY_POOR;
    return HEALTH_ADVISORIES.SEVERE;
  }
  return HEALTH_ADVISORIES.MODERATE;
}

function getAqiColorTheme(aqiVal) {
  if (aqiVal <= 50) {
    return {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badge: 'bg-emerald-600 text-white',
      category: 'Good',
    };
  }
  if (aqiVal <= 100) {
    return {
      bg: 'bg-lime-50 text-lime-800 border-lime-200',
      badge: 'bg-lime-600 text-white',
      category: 'Satisfactory',
    };
  }
  if (aqiVal <= 200) {
    return {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      badge: 'bg-amber-600 text-white',
      category: 'Moderate',
    };
  }
  if (aqiVal <= 300) {
    return {
      bg: 'bg-orange-50 text-orange-800 border-orange-200',
      badge: 'bg-orange-600 text-white',
      category: 'Poor',
    };
  }
  if (aqiVal <= 400) {
    return {
      bg: 'bg-red-50 text-red-800 border-red-200',
      badge: 'bg-red-600 text-white',
      category: 'Very Poor',
    };
  }
  return {
    bg: 'bg-rose-50 text-rose-900 border-rose-300',
    badge: 'bg-rose-700 text-white',
    category: 'Severe',
  };
}

export default function LocalityAqiTab({ locality }) {
  const { latitude, longitude, locality_name, radius_km } = locality;

  // Real-time current AQI conditions
  const currentQuery = useQuery({
    queryKey: ['airQuality', 'current', latitude, longitude],
    queryFn: () => getCurrentConditions(latitude, longitude),
    staleTime: 5 * 60 * 1000,
  });

  // 96-hour forecast
  const forecastQuery = useQuery({
    queryKey: ['airQuality', 'forecast', latitude, longitude],
    queryFn: () => getForecast(latitude, longitude),
    staleTime: 10 * 60 * 1000,
  });

  const isLoading = currentQuery.isLoading || forecastQuery.isLoading;
  const isError = currentQuery.isError || forecastQuery.isError;

  // Extract AQI details
  const aqiInfo = useMemo(() => {
    const rawData = currentQuery.data?.data;
    if (!rawData) return null;

    const indexes = rawData.aqi || [];
    const cpcb = indexes.find((i) => i.code === 'ind_cpcb');
    const uaqi = indexes.find((i) => i.code === 'uaqi');
    const primary = cpcb || uaqi || indexes[0];

    const aqiVal = primary?.aqi ?? (primary?.aqiDisplay ? Number(primary.aqiDisplay) : null);
    const category = primary?.category || 'Unknown';
    const dominant = primary?.dominantPollutant || 'PM2.5';

    return {
      aqiVal: aqiVal != null ? Math.round(aqiVal) : 75,
      category,
      dominant,
      pollutants: rawData.pollutants || [],
    };
  }, [currentQuery.data]);

  // Compute Next 24-Hour Forecast Average (Discards after 24 hrs)
  const forecast24hStats = useMemo(() => {
    const rawForecast = forecastQuery.data?.data?.forecast;
    if (!Array.isArray(rawForecast) || rawForecast.length === 0) return null;

    // Filter strictly the first 24 hours
    const next24Hours = rawForecast.slice(0, 24);

    let sum = 0;
    let count = 0;
    let min = Infinity;
    let max = -Infinity;
    let peakHour = null;

    next24Hours.forEach((hour) => {
      const idxs = hour.aqi || [];
      const primary = idxs.find((i) => i.code === 'ind_cpcb') || idxs[0];
      const val = primary?.aqi ?? (primary?.aqiDisplay ? Number(primary.aqiDisplay) : null);

      if (val != null && !isNaN(val)) {
        sum += val;
        count++;
        if (val < min) min = val;
        if (val > max) {
          max = val;
          peakHour = hour.timestamp;
        }
      }
    });

    if (count === 0) return null;

    const avgAqi = Math.round(sum / count);
    const theme = getAqiColorTheme(avgAqi);

    return {
      hoursCount: count,
      avgAqi,
      minAqi: Math.round(min),
      maxAqi: Math.round(max),
      category: theme.category,
      theme,
      peakHour,
    };
  }, [forecastQuery.data]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs flex flex-col items-center justify-center min-h-[320px]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-700">Fetching locality atmospheric telemetry…</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Calculating 24-hour prediction models</p>
      </div>
    );
  }

  if (isError || !aqiInfo) {
    return (
      <div className="bg-white rounded-3xl border border-red-200 p-8 shadow-xs text-center">
        <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-900">Locality Telemetry Unavailable</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
          Could not retrieve current air quality measurements for {locality_name}.
        </p>
        <button
          type="button"
          onClick={() => {
            currentQuery.refetch();
            forecastQuery.refetch();
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const currentTheme = getAqiColorTheme(aqiInfo.aqiVal);
  const healthAdvisory = getAdvisoryParagraph(aqiInfo.aqiVal, aqiInfo.category);

  return (
    <div className="space-y-4">
      {/* Top Compact Command Center Grid: Live AQI & 24h Prediction Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Live Locality AQI Summary Card */}
        <div className="md:col-span-6 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Locality AQI</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {radius_km} km radius
              </span>
            </div>

            <div className="flex items-baseline gap-4 mb-2">
              <span className="text-5xl font-black text-slate-900 tracking-tight">
                {aqiInfo.aqiVal}
              </span>
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs ${currentTheme.badge}`}
                >
                  {aqiInfo.category}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Dominant: <strong className="text-slate-800 uppercase">{aqiInfo.dominant}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>CPCB India Air Quality Standard</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Real-time</span>
            </span>
          </div>
        </div>

        {/* Right: Next 24-Hour Average Prediction Card (Next 24h Only, >24h Discarded) */}
        <div className="md:col-span-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Next 24-Hour Prediction Average</span>
              </span>
              <span className="text-[10px] font-semibold bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
                24h Model
              </span>
            </div>

            {forecast24hStats ? (
              <div className="flex items-baseline gap-4 mb-2">
                <span className="text-5xl font-black text-emerald-400 tracking-tight">
                  {forecast24hStats.avgAqi}
                </span>
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${forecast24hStats.theme.badge}`}
                  >
                    Avg: {forecast24hStats.category}
                  </span>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Range: {forecast24hStats.minAqi} – {forecast24hStats.maxAqi} AQI
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">24-hour prediction compiling…</p>
            )}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Calculated across 24 hourly forecasts</span>
            </span>
            <span className="text-emerald-300 font-medium text-[10px]">
              Post-24h data discarded
            </span>
          </div>
        </div>
      </div>

      {/* Compact Pollutant Grid (PM2.5, PM10, NO2, SO2, CO, O3) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-emerald-600" />
          <span>Key Locality Pollutants Breakdown</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {['pm25', 'pm10', 'no2', 'so2', 'co', 'o3'].map((code) => {
            const item = aqiInfo.pollutants.find(
              (p) => p.code?.toLowerCase() === code || p.displayName?.toLowerCase().includes(code)
            );
            const value = item?.concentration?.value != null ? Math.round(item.concentration.value * 10) / 10 : '--';
            const units = item?.concentration?.units || 'µg/m³';
            const name = item?.displayName || code.toUpperCase();

            return (
              <div
                key={code}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">{name}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-mono">{code}</span>
                </div>
                <div className="my-1.5">
                  <span className="text-lg font-black text-slate-900">{value}</span>
                  <span className="text-[10px] text-slate-400 ml-1">{units}</span>
                </div>
                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1 rounded-full"
                    style={{
                      width: `${Math.min(100, typeof value === 'number' ? (value / 150) * 100 : 30)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hardcoded Health Advisory from Dashboard (Compact layout) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Community Health Advisory • {aqiInfo.category} Conditions
            </h4>
            <span className="text-[10px] text-slate-400">
              Official Central Pollution Control Board (CPCB) Guidelines
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed pl-9">
          {healthAdvisory}
        </p>
      </div>
    </div>
  );
}
