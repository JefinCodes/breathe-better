import { Map, LayoutDashboard, ArrowLeftRight, History, BookOpen } from 'lucide-react';
import { NavLink } from 'react-router-dom';

/**
 * Shared top navigation bar for Breathe Better.
 * Offers seamless switching between:
 * - Dashboard (Page 1)
 * - Pollution Heat Map (Page 2)
 * - Location Comparison (Page 3)
 * - Historical Pollution Tracker (Page 4)
 * - AQI Guide (Page 5)
 *
 * @param {object} props
 * @param {React.ReactNode} [props.rightContent] - Optional right-aligned action (e.g. Change Location button)
 */
export default function Navbar({ rightContent }) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand logo & name */}
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <NavLink to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <img
              src="/logo.png"
              alt="Breathe Better"
              className="w-8 h-8 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
            />
            <span className="font-bold text-gray-900 text-base tracking-tight hidden sm:inline">
              Breathe Better
            </span>
          </NavLink>

          {/* Navigation links */}
          <nav className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl overflow-x-auto scrollbar-none max-w-full">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`
              }
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/map"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`
              }
            >
              <Map className="w-3.5 h-3.5" />
              <span>Pollution Heat Map</span>
            </NavLink>

            <NavLink
              to="/compare"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`
              }
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Compare</span>
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`
              }
            >
              <History className="w-3.5 h-3.5" />
              <span>Historical Tracker</span>
            </NavLink>

            <NavLink
              to="/guide"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`
              }
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>AQI Guide</span>
            </NavLink>
          </nav>
        </div>

        {/* Right content / actions */}
        <div className="flex-shrink-0">{rightContent}</div>
      </div>
    </header>
  );
}
