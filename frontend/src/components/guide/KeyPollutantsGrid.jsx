import { useState } from 'react';
import { Wind, Flame, Factory, Car, Activity, ShieldAlert, Sparkles, AlertCircle, Filter } from 'lucide-react';
import { KEY_POLLUTANTS } from '../../lib/aqiGuideData';

const FILTER_TABS = [
  { id: 'all', label: 'All 8 Pollutants' },
  { id: 'pm', label: 'Particulate Matter' },
  { id: 'gas', label: 'Combustion Gases' },
  { id: 'other', label: 'Ozone, Ammonia & Lead' },
];

/**
 * KeyPollutantsGrid
 * Displays the 8 key air pollutants monitored by CPCB:
 * PM10, PM2.5, NO2, SO2, CO, O3, NH3, Pb.
 */
export default function KeyPollutantsGrid() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredPollutants = KEY_POLLUTANTS.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pm') return item.category.includes('Particulate');
    if (activeFilter === 'gas') return item.category.includes('Combustion');
    if (activeFilter === 'other') {
      return (
        item.category.includes('Photochemical') ||
        item.category.includes('Agricultural') ||
        item.category.includes('Heavy Metal')
      );
    }
    return true;
  });

  const getPollutantIcon = (id) => {
    switch (id) {
      case 'pm10':
      case 'pm25':
        return <Wind className="w-4 h-4" />;
      case 'no2':
        return <Car className="w-4 h-4" />;
      case 'so2':
        return <Factory className="w-4 h-4" />;
      case 'co':
        return <Flame className="w-4 h-4" />;
      case 'o3':
        return <Sparkles className="w-4 h-4" />;
      case 'nh3':
        return <Activity className="w-4 h-4" />;
      case 'pb':
        return <ShieldAlert className="w-4 h-4" />;
      default:
        return <Wind className="w-4 h-4" />;
    }
  };

  return (
    <section id="pollutants" className="space-y-6">
      {/* Section Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                <Wind className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Criteria Pollutants
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-1">
              Key Air Pollutants Monitored by CPCB
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
              India’s National Air Quality Index continually audits these 8 standard environmental contaminants to quantify atmospheric toxicity and protect community health.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold">
              8 Standard Pollutants
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold">
              Rolling 24h &amp; 8h Averages
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 overflow-x-auto scrollbar-none pb-1">
          <Filter className="w-3.5 h-3.5 text-gray-400 mr-1 flex-shrink-0" />
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pollutant Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        {filteredPollutants.map((pollutant) => (
          <div
            key={pollutant.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-gray-200 transition-all flex flex-col justify-between group"
          >
            <div className="space-y-4">
              {/* Header: Symbol & Name & Averaging Window */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center text-lg shadow-xs group-hover:scale-105 transition-transform">
                    {pollutant.symbol}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 leading-snug">
                      {pollutant.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-semibold text-gray-500">
                        {pollutant.size}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-[11px] font-semibold flex-shrink-0">
                  {getPollutantIcon(pollutant.id)}
                  <span>{pollutant.averagingPeriod.split(' ')[0]}</span>
                </span>
              </div>

              {/* Category Badge */}
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${pollutant.badgeColor}`}
                >
                  {pollutant.category}
                </span>
              </div>

              {/* Sources */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                  Primary Sources
                </span>
                <p className="text-xs text-gray-700 font-medium leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  {pollutant.sources}
                </p>
              </div>

              {/* Health Impact */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Health Impact &amp; Risks
                </span>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {pollutant.impact}
                </p>
              </div>
            </div>

            {/* Scientific Note */}
            <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 italic">
              <strong>CPCB Observation:</strong> {pollutant.keyFact}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
