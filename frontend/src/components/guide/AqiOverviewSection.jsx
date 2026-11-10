import { Info, Building2, Calendar, Award, ShieldCheck } from 'lucide-react';

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: What is the AQI? */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 md:p-7 flex flex-col justify-between">
          <div className="space-y-3.5 sm:space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
                  Core Concept
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
                  What is the Air Quality Index (AQI)?
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              The Air Quality Index (AQI) is a daily
              reporting tool used to communicate how clean or polluted the outdoor air is and what associated
              health effects might be a concern for you.
            </p>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Instead of presenting complex scientific measurements, the AQI translates air pollution data into a
              single, easy-to-understand number on a scale from 0 to 500, paired with a descriptive category
              and color code. The higher the AQI value, the greater the level of air pollution and the higher the
              health risk.
            </p>
          </div>

          {/* Key pillars */}
          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-100 grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gray-50">
              <span className="text-xs font-bold text-gray-900 block">0 – 500</span>
              <span className="text-[10px] sm:text-[11px] text-gray-500">Universal Range</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-gray-50">
              <span className="text-xs font-bold text-gray-900 block">6 Tiers</span>
              <span className="text-[10px] sm:text-[11px] text-gray-500">Color-Coded Levels</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-gray-50">
              <span className="text-xs font-bold text-gray-900 block">Health First</span>
              <span className="text-[10px] sm:text-[11px] text-gray-500">Action Guidelines</span>
            </div>
          </div>
        </div>

        {/* Card 2: What is the CPCB? */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 md:p-7 flex flex-col justify-between">
          <div className="space-y-3.5 sm:space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
                  Statutory Authority
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
                  What is the CPCB?
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              The Central Pollution Control Board (CPCB) is
              India’s apex statutory organization under the{' '}
              Ministry of Environment, Forest and Climate Change (MoEFCC).
            </p>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Established in 1974, the CPCB monitors
              environmental standards across the country and operates the{' '}
              National Air Quality Monitoring Programme (NAMP).
            </p>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Under the Swachh Bharat Abhiyan, the CPCB
              launched the National Air Quality Index with the motto{' '}
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200/60">
                &quot;One Number – One Colour – One Description&quot;
              </span>{' '}
              to help citizens easily assess air quality in their neighborhoods.
            </p>
          </div>

          {/* Quick authority badges */}
          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-100 flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] sm:text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              Est. 1974
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] sm:text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
              MoEFCC Apex Body
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] sm:text-xs font-medium">
              <Award className="w-3.5 h-3.5 text-gray-500" />
              NAMP Operator
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
