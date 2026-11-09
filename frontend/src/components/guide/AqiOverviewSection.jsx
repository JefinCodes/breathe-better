import { Info, Building2, Calendar, Award, Sparkles, ShieldCheck } from 'lucide-react';

/**
 * AqiOverviewSection
 * Explains:
 * 1. What is the Air Quality Index (AQI)?
 * 2. What is the CPCB?
 * 3. Swachh Bharat Abhiyan & "One Number – One Colour – One Description" motto.
 */
export default function AqiOverviewSection() {
  return (
    <section id="overview" className="space-y-6">
      {/* 2-Column Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: What is the AQI? */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">
                  Core Concept
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  What is the Air Quality Index (AQI)?
                </h2>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              The <strong className="text-gray-900 font-semibold">Air Quality Index (AQI)</strong> is a daily
              reporting tool used to communicate how clean or polluted the outdoor air is and what associated
              health effects might be a concern for you.
            </p>

            <p className="text-sm text-gray-600 leading-relaxed">
              Instead of presenting complex scientific measurements, the AQI translates air pollution data into a
              single, easy-to-understand number on a scale from{' '}
              <strong className="text-gray-900 font-semibold">0 to 500</strong>, paired with a descriptive category
              and color code. The higher the AQI value, the greater the level of air pollution and the higher the
              health risk.
            </p>
          </div>

          {/* Key pillars */}
          <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-gray-50">
              <span className="text-xs font-bold text-gray-900 block">0 – 500</span>
              <span className="text-[11px] text-gray-500">Universal Range</span>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50">
              <span className="text-xs font-bold text-gray-900 block">6 Tiers</span>
              <span className="text-[11px] text-gray-500">Color-Coded Levels</span>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50">
              <span className="text-xs font-bold text-gray-900 block">Health First</span>
              <span className="text-[11px] text-gray-500">Action Guidelines</span>
            </div>
          </div>
        </div>

        {/* Card 2: What is the CPCB? */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
                  Statutory Authority
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  What is the CPCB?
                </h2>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              The <strong className="text-gray-900 font-semibold">Central Pollution Control Board (CPCB)</strong> is
              India’s apex statutory organization under the{' '}
              <strong className="text-gray-900 font-semibold">
                Ministry of Environment, Forest and Climate Change (MoEFCC)
              </strong>.
            </p>

            <p className="text-sm text-gray-600 leading-relaxed">
              Established in <strong className="text-gray-900 font-semibold">1974</strong>, the CPCB monitors
              environmental standards across the country and operates the{' '}
              <strong className="text-gray-900 font-semibold">
                National Air Quality Monitoring Programme (NAMP)
              </strong>.
            </p>

            <p className="text-sm text-gray-600 leading-relaxed">
              Under the <strong className="text-gray-900 font-semibold">Swachh Bharat Abhiyan</strong>, the CPCB
              launched the National Air Quality Index with the motto{' '}
              <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200/60">
                &quot;One Number – One Colour – One Description&quot;
              </span>{' '}
              to help citizens easily assess air quality in their neighborhoods.
            </p>
          </div>

          {/* Quick authority badges */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              Est. 1974
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
              MoEFCC Apex Body
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium">
              <Award className="w-3.5 h-3.5 text-gray-500" />
              NAMP Operator
            </span>
          </div>
        </div>
      </div>

      {/* Motto Highlight Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-amber-300" />
            National AQI Philosophy
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            &quot;One Number – One Colour – One Description&quot;
          </h3>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Promulgated under Swachh Bharat Abhiyan to replace complicated parts-per-million and micrograms-per-cubic-meter values with a unified public-health metric that everyone can immediately understand.
          </p>
        </div>

        <div className="flex-shrink-0 grid grid-cols-3 sm:flex items-center gap-2 text-center">
          <div className="px-3.5 py-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
            <span className="block text-lg font-black">1</span>
            <span className="text-[10px] text-blue-200 uppercase font-semibold">Number</span>
          </div>
          <div className="px-3.5 py-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
            <span className="block text-lg font-black">1</span>
            <span className="text-[10px] text-blue-200 uppercase font-semibold">Colour</span>
          </div>
          <div className="px-3.5 py-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
            <span className="block text-lg font-black">1</span>
            <span className="text-[10px] text-blue-200 uppercase font-semibold">Description</span>
          </div>
        </div>
      </div>
    </section>
  );
}
