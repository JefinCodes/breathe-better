import { Calculator, AlertTriangle, Clock, Binary, Award, CheckCircle2 } from 'lucide-react';
import { CALCULATION_STEPS, CPCB_STATION_RULE } from '../../lib/aqiGuideData';

/**
 * CalculationMethodologySection
 * Explains:
 * 1. 8 major air pollutants basis
 * 2. Station requirement: >= 3 pollutants, PM10 or PM2.5 mandatory
 * 3. 3-step calculation process:
 *    - Averaging Periods (24h vs 8h)
 *    - Sub-Index Calculation (Breakpoints)
 *    - Final AQI Score (Highest sub-index = Prominent Pollutant)
 */
export default function CalculationMethodologySection() {
  return (
    <section id="calculation" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7 space-y-7">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <Calculator className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              CPCB Methodology
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-1">
            How Does CPCB Calculate AQI?
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md">
          A scientific 3-step aggregation converting multi-sensor physical concentrations into a unified public index.
        </p>
      </div>

      {/* Mandatory Station Rule Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              {CPCB_STATION_RULE.title}
            </span>
            <span className="px-2 py-0.5 bg-amber-200/60 text-amber-900 text-[10px] font-bold rounded-full">
              Mandatory Threshold
            </span>
          </div>
          <p className="text-sm font-semibold text-amber-900 leading-snug">
            {CPCB_STATION_RULE.rule}
          </p>
          <p className="text-xs text-amber-800/80 leading-relaxed">
            {CPCB_STATION_RULE.significance}
          </p>
        </div>
      </div>

      {/* 3 Step Visual Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
        {CALCULATION_STEPS.map((item, idx) => {
          const isFirst = idx === 0;
          const isSecond = idx === 1;
          const isThird = idx === 2;

          return (
            <div
              key={item.step}
              className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col justify-between relative hover:border-blue-200 transition-colors group"
            >
              <div className="space-y-3">
                {/* Step pill */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs">
                    {item.step === '1' && <Clock className="w-3.5 h-3.5" />}
                    {item.step === '2' && <Binary className="w-3.5 h-3.5" />}
                    {item.step === '3' && <Award className="w-3.5 h-3.5" />}
                    Step {item.step}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400">
                    {idx + 1} of 3
                  </span>
                </div>

                {/* Step title */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 tracking-tight">
                    {item.title}
                  </h3>
                  <span className="text-xs font-medium text-blue-600 block mt-0.5">
                    {item.summary}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Extra context footer */}
              <div className="mt-4 pt-3 border-t border-gray-200/60 text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>
                  {isFirst && 'PM₁₀, PM₂.₅, NO₂, SO₂, NH₃, Pb (24h) | CO, O₃ (8h)'}
                  {isSecond && 'Piecewise linear interpolation on CPCB breakpoint table'}
                  {isThird && 'Highest sub-index crowned as "Prominent Pollutant"'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
