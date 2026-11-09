import { BookOpen, ArrowRight, ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import Navbar from '../components/Navbar';
import AqiOverviewSection from '../components/guide/AqiOverviewSection';
import CalculationMethodologySection from '../components/guide/CalculationMethodologySection';
import KeyPollutantsGrid from '../components/guide/KeyPollutantsGrid';
import AqiCategoriesTable from '../components/guide/AqiCategoriesTable';
import InteractiveAqiExplorer from '../components/guide/InteractiveAqiExplorer';

/**
 * AqiGuide Page (Page 5)
 *
 * Comprehensive educational guide covering:
 * - What is the Air Quality Index (AQI)?
 * - What is the Central Pollution Control Board (CPCB)?
 * - Swachh Bharat Abhiyan & "One Number – One Colour – One Description" motto
 * - How CPCB Calculates AQI (Averaging periods, Breakpoint Sub-Indices, Max rule & Prominent Pollutant)
 * - Minimum 3 pollutants with PM10 or PM2.5 rule
 * - Key 8 Air Pollutants monitored by CPCB (PM10, PM2.5, NO2, SO2, CO, O3, NH3, Pb)
 * - CPCB AQI Categories, Color Codes, UI Hex Codes, & Health Guidelines (0-50 to 401-500)
 * - Interactive AQI Scale explorer
 */
export default function AqiGuide() {
  const quickLinks = [
    { href: '#overview', label: '1. What is AQI & CPCB' },
    { href: '#calculation', label: '2. Calculation Method' },
    { href: '#pollutants', label: '3. The 8 Pollutants' },
    { href: '#categories', label: '4. Categories & Health Guidelines' },
    { href: '#interactive', label: '5. Interactive Scale' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-8 pb-20">
        {/* Page Hero Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide">
            <BookOpen className="w-3.5 h-3.5" />
            Page 5 • Understanding India’s AQI
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Understanding India’s Air Quality Index (AQI)
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-3xl leading-relaxed">
            Discover how the Central Pollution Control Board (CPCB) measures environmental safety, aggregates 8 major air pollutants into standardized sub-indices, and translates complex scientific metrics into actionable health advisories.
          </p>

          {/* Quick-Jump In-Page Anchor Navigation */}
          <nav aria-label="Page subnavigation" className="pt-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Jump To:
              </span>
              {quickLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-200/80 text-gray-700 hover:text-blue-600 hover:border-blue-300 transition-colors whitespace-nowrap shadow-2xs"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
        </div>

        {/* Section 1: Overview & What is CPCB */}
        <AqiOverviewSection />

        {/* Section 2: Calculation Methodology */}
        <CalculationMethodologySection />

        {/* Section 3: Key Air Pollutants */}
        <KeyPollutantsGrid />

        {/* Section 4: Categories & Health Guidelines */}
        <AqiCategoriesTable />

        {/* Section 5: Interactive AQI Explorer */}
        <InteractiveAqiExplorer />

        {/* Bottom Navigation / Links to App Features */}
        <div className="bg-gradient-to-br from-gray-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Breathe Better • Practical Next Steps
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            Apply These Standards to Your City
          </h3>
          <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
            Now that you understand India’s CPCB air quality framework, track real-time observations, inspect spatial satellite heat maps, or analyze historical 30-day pollutant trajectories across verified Indian cities.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <NavLink
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white transition-colors"
            >
              <span>Live Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>

            <NavLink
              to="/map"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-semibold text-xs text-white transition-colors border border-white/10"
            >
              <span>Pollution Heat Map</span>
            </NavLink>

            <NavLink
              to="/compare"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-semibold text-xs text-white transition-colors border border-white/10"
            >
              <span>Compare Cities</span>
            </NavLink>

            <NavLink
              to="/history"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-semibold text-xs text-white transition-colors border border-white/10"
            >
              <span>Historical Tracker</span>
            </NavLink>
          </div>
        </div>
      </main>
    </div>
  );
}
