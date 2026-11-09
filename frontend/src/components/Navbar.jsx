import { MapPin, Map, LayoutDashboard, ArrowLeftRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

/**
 * Shared top navigation bar for Breathe Better.
 * Offers seamless switching between Dashboard (Page 1), Pollution Heat Map (Page 2),
 * and Location Comparison (Page 3).
 *
 * @param {object} props
 * @param {React.ReactNode} [props.rightContent] - Optional right-aligned action (e.g. Change Location button)
 */
export default function Navbar({ rightContent }) {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand logo & name */}
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">
              Breathe Better
            </span>
          </NavLink>

          {/* Navigation links */}
          <nav className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm'
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
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm'
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
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`
              }
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Compare</span>
            </NavLink>
          </nav>
        </div>

        {/* Right content / actions */}
        <div>{rightContent}</div>
      </div>
    </header>
  );
}
