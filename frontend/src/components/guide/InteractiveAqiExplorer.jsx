import { useState, useMemo } from 'react';
import { Sliders, CheckCircle2 } from 'lucide-react';
import { AQI_CATEGORIES } from '../../lib/aqiGuideData';

/**
 * InteractiveAqiExplorer
 * Allows users to scrub or click across 0–500 to dynamically observe
 * the corresponding CPCB category, color code, health impacts, and actionable steps.
 */
export default function InteractiveAqiExplorer() {
  const [sliderValue, setSliderValue] = useState(135);

  const activeCategory = useMemo(() => {
    return (
      AQI_CATEGORIES.find(
        (cat) => sliderValue >= cat.min && sliderValue <= cat.max
      ) || AQI_CATEGORIES[AQI_CATEGORIES.length - 1]
    );
  }, [sliderValue]);

  const presetValues = [
    { label: 'Good (25)', value: 25 },
    { label: 'Satisfactory (75)', value: 75 },
    { label: 'Moderate (150)', value: 150 },
    { label: 'Poor (250)', value: 250 },
    { label: 'Very Poor (350)', value: 350 },
    { label: 'Severe (450)', value: 450 },
  ];

  return (
    <section id="interactive" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <Sliders className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Interactive Simulator
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-1">
            Explore India’s AQI Scale in Real Time
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md">
          Adjust the slider or pick a preset to preview how different air quality readings translate into health impacts.
        </p>
      </div>

      {/* Preset Chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
          Quick Jump:
        </span>
        {presetValues.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => setSliderValue(preset.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              sliderValue === preset.value
                ? 'bg-gray-900 text-white shadow-xs font-semibold'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200/80'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Slider Bar */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-500">
          <span>0 (Cleanest)</span>
          <span className="text-sm font-extrabold text-gray-900">
            Selected AQI: <span className="font-mono text-base text-emerald-600">{sliderValue}</span>
          </span>
          <span>500 (Hazardous)</span>
        </div>

        {/* Custom Range Slider with gradient background matching CPCB colors */}
        <div className="relative py-2">
          <input
            type="range"
            min="0"
            max="500"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-full h-3 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            style={{
              background: `linear-gradient(to right, #00B050 0%, #00B050 10%, #92D050 10%, #92D050 20%, #FFFF00 20%, #FFFF00 40%, #FF9900 40%, #FF9900 60%, #FF0000 60%, #FF0000 80%, #C00000 80%, #C00000 100%)`,
            }}
          />
        </div>

        {/* Gradient Legend Track ticks */}
        <div className="hidden sm:grid grid-cols-6 gap-1 text-[11px] font-semibold text-gray-400 pt-1">
          <div>0 – 50<br /><span className="text-[10px] font-normal">Good</span></div>
          <div>51 – 100<br /><span className="text-[10px] font-normal">Satisfactory</span></div>
          <div>101 – 200<br /><span className="text-[10px] font-normal">Moderate</span></div>
          <div>201 – 300<br /><span className="text-[10px] font-normal">Poor</span></div>
          <div>301 – 400<br /><span className="text-[10px] font-normal">Very Poor</span></div>
          <div>401 – 500<br /><span className="text-[10px] font-normal">Severe</span></div>
        </div>
      </div>

      {/* Dynamic Result Card */}
      <div
        className="rounded-2xl p-6 sm:p-7 border transition-all space-y-5"
        style={{
          borderColor: activeCategory.hexCode,
          backgroundColor: `${activeCategory.hexCode}0d`, // subtle 5% alpha tint
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10">
          <div className="flex items-center gap-3.5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm border border-black/10"
              style={{
                backgroundColor: activeCategory.hexCode,
                color: activeCategory.textColor,
              }}
            >
              {sliderValue}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Current Classification
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-gray-700 border border-gray-200 font-mono">
                  {activeCategory.range}
                </span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                {activeCategory.category}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs border"
              style={{
                backgroundColor: activeCategory.hexCode,
                color: activeCategory.textColor,
                borderColor: 'rgba(0,0,0,0.1)',
              }}
            >
              {activeCategory.colorCode} ({activeCategory.hexCode})
            </span>
          </div>
        </div>

        {/* Detailed Impact & Recommended Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                Clinical Health Impact
              </span>
              <p className="text-sm font-semibold text-gray-900 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-black/5">
                {activeCategory.impact}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                Official CPCB Health Advisory
              </span>
              <p className="text-xs text-gray-700 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-black/5">
                {activeCategory.guideline}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              Practical Action Checklist
            </span>
            <ul className="space-y-2 text-xs text-gray-700">
              {activeCategory.recommendedActions.map((action, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 bg-white/80 p-2.5 rounded-xl border border-black/5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
