import { useState } from 'react';
import { Copy, Check, HeartPulse } from 'lucide-react';
import { AQI_CATEGORIES } from '../../lib/aqiGuideData';

/**
 * AqiCategoriesTable
 * Complete CPCB AQI Categories, Color Codes & Health Guidelines.
 * Displays AQI Range, Category, Color Code, Hex Code (for UI), and Health Impacts & Guidelines.
 */
export default function AqiCategoriesTable() {
  const [copiedHex, setCopiedHex] = useState(null);

  const handleCopyHex = (hex) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  return (
    <section id="categories" className="space-y-6">
      {/* Section Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                <HeartPulse className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                Official Standards
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-1">
              CPCB AQI Categories, Color Codes &amp; Health Guidelines
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md">
            Standard health impact breakpoints and advisory protocols mandated by the Central Pollution Control Board.
          </p>
        </div>
      </div>

      {/* Desktop / Tablet Table View (hidden on small mobile screens for optimal UX) */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-3.5 px-4">AQI Range</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Color Code</th>
                <th className="py-3.5 px-4">Hex Code (UI)</th>
                <th className="py-3.5 px-5">Health Impacts &amp; Guidelines</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {AQI_CATEGORIES.map((cat) => (
                <tr key={cat.range} className="hover:bg-gray-50/60 transition-colors">
                  {/* Range */}
                  <td className="py-4 px-4 font-bold text-gray-900 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-lg bg-gray-100 font-mono text-xs">
                      {cat.range}
                    </span>
                  </td>

                  {/* Category with Color Chip */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-xs border border-black/10"
                        style={{ backgroundColor: cat.hexCode }}
                      />
                      <span className="font-extrabold text-gray-900 text-sm">
                        {cat.category}
                      </span>
                    </div>
                  </td>

                  {/* Color Code Name */}
                  <td className="py-4 px-4 whitespace-nowrap font-medium text-gray-600">
                    <span
                      className="inline-block px-2 py-0.5 rounded text-[11px] font-bold shadow-2xs border"
                      style={{
                        backgroundColor: cat.hexCode,
                        color: cat.textColor,
                        borderColor: 'rgba(0,0,0,0.1)',
                      }}
                    >
                      {cat.colorCode}
                    </span>
                  </td>

                  {/* Hex Code (With Copy) */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleCopyHex(cat.hexCode)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-mono text-[11px] transition-colors"
                      title="Click to copy hex code"
                    >
                      <span>{cat.hexCode}</span>
                      {copiedHex === cat.hexCode ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  </td>

                  {/* Health Impacts & Guidelines */}
                  <td className="py-4 px-5">
                    <div className="space-y-1.5 max-w-xl">
                      <p className="text-gray-900 font-semibold leading-relaxed">
                        <span className="text-gray-500 font-normal uppercase text-[10px] tracking-wider block">
                          Impact
                        </span>
                        {cat.impact}
                      </p>
                      <p className="text-gray-600 leading-relaxed text-xs">
                        <span className="text-emerald-600 font-semibold uppercase text-[10px] tracking-wider block">
                          Guideline
                        </span>
                        {cat.guideline}
                      </p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (shown below md screen width) */}
      <div className="md:hidden space-y-4">
        {AQI_CATEGORIES.map((cat) => (
          <div
            key={cat.range}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 relative overflow-hidden"
          >
            {/* Color banner strip on left */}
            <div
              className="absolute left-0 top-0 bottom-0 w-2"
              style={{ backgroundColor: cat.hexCode }}
            />

            <div className="pl-1 space-y-3">
              {/* Category & Range */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full shadow-xs"
                    style={{ backgroundColor: cat.hexCode }}
                  />
                  <h3 className="font-extrabold text-gray-900 text-base">
                    {cat.category}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 font-mono font-bold text-xs text-gray-800">
                  AQI {cat.range}
                </span>
              </div>

              {/* Color & Hex badge */}
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-bold"
                  style={{
                    backgroundColor: cat.hexCode,
                    color: cat.textColor,
                  }}
                >
                  {cat.colorCode}
                </span>

                <button
                  type="button"
                  onClick={() => handleCopyHex(cat.hexCode)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[11px]"
                >
                  <span>{cat.hexCode}</span>
                  {copiedHex === cat.hexCode ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Impact */}
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Health Impact
                </span>
                <p className="text-xs text-gray-900 font-medium leading-relaxed">
                  {cat.impact}
                </p>
              </div>

              {/* Guideline */}
              <div className="space-y-0.5 pt-1 border-t border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                  CPCB Health Guideline
                </span>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {cat.guideline}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
