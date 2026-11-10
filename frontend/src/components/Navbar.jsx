import { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  ArrowLeftRight,
  History,
  BookOpen,
  Menu,
  X,
  ChevronRight,
  Wind,
  Sparkles,
} from 'lucide-react';

/**
 * Navigation configuration items.
 * Each item defines paths, icons, and descriptions for mobile and desktop menus.
 */
const NAV_ITEMS = [
  {
    to: '/',
    end: true,
    label: 'Dashboard',
    mobileTitle: 'Live Dashboard',
    description: 'Real-time AQI, key pollutants & health advice',
    icon: LayoutDashboard,
    badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  {
    to: '/map',
    end: false,
    label: 'Heat Map',
    mobileTitle: 'Pollution Heat Map',
    description: 'Interactive geospatial air quality across India',
    icon: Map,
    badgeColor: 'bg-teal-50 text-teal-600 border-teal-100',
  },
  {
    to: '/compare',
    end: false,
    label: 'Compare',
    mobileTitle: 'Location Comparison',
    description: 'Side-by-side AQI & pollutant metrics analysis',
    icon: ArrowLeftRight,
    badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  },
  {
    to: '/history',
    end: false,
    label: 'Tracker',
    mobileTitle: 'Historical Tracker',
    description: '7-day trends, historical patterns & forecasts',
    icon: History,
    badgeColor: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  {
    to: '/guide',
    end: false,
    label: 'AQI Guide',
    mobileTitle: 'AQI & Health Guide',
    description: 'CPCB categories, health impacts & safety tips',
    icon: BookOpen,
    badgeColor: 'bg-purple-50 text-purple-600 border-purple-100',
  },
];

/**
 * Modern responsive navigation header for Breathe Better.
 * Features:
 * - Frosted glassmorphism bar with top emerald accent stripe
 * - Clear brand identity with live AQI status pill
 * - Sleek floating segmented pill navigation on desktop
 * - Full-featured hamburger menu drawer for mobile screens (< md)
 * - Auto-dismiss on route change, escape key, or backdrop click
 * - Body scroll lock on mobile when drawer is active
 *
 * @param {object} props
 * @param {React.ReactNode} [props.rightContent] - Optional right-aligned action (e.g. Refresh Data button)
 */
export default function Navbar({ rightContent }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);

  // Auto-close menu when route changes without cascading render effect
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setIsMobileMenuOpen(false);
  }

  // Close mobile menu when screen size reaches desktop breakpoint (md: 768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on Escape key press
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setIsMobileMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, handleKeyDown]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-all">
      {/* Top micro-gradient stripe */}
      <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

      {/* Main navigation row */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand identity: Logo, Name & Live status badge */}
        <div className="flex items-center gap-3">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl py-1 select-none"
            aria-label="Breathe Better Home"
          >
            <div className="relative flex-shrink-0">
              <img
                src="/logo.png"
                alt="Breathe Better"
                className="w-8 h-8 sm:w-9 sm:h-9 object-cover rounded-xl shadow-xs ring-1 ring-slate-200/90 group-hover:ring-emerald-500/50 group-hover:shadow-emerald-500/20 group-hover:shadow-md transition-all duration-200 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight group-hover:text-emerald-700 transition-colors">
                Breathe<span className="text-emerald-600 ml-0.5">Better</span>
              </span>
            </div>
          </NavLink>

          {/* Live indicator badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs select-none">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            LIVE AQI
          </span>
        </div>

        {/* Desktop Navigation links (hidden on mobile, visible on md and up) */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group relative flex items-center gap-2 px-3 lg:px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 select-none ${
                  isActive
                    ? 'bg-white text-emerald-700 shadow-sm border border-emerald-500/15 ring-1 ring-emerald-500/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive
                        ? 'text-emerald-600'
                        : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span>{item.label}</span>
                  {isActive && <span className="sr-only">(current page)</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right action area: Page-specific button + Mobile hamburger toggle */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {rightContent && (
            <div className="flex-shrink-0 transition-opacity">
              {rightContent}
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            className={`md:hidden relative p-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 flex items-center justify-center ${
              isMobileMenuOpen
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs rotate-90'
                : 'text-slate-700 bg-slate-100/90 hover:bg-slate-200/90 hover:text-slate-900 border border-slate-200/70'
            }`}
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 transition-transform" />
            ) : (
              <Menu className="w-5 h-5 transition-transform" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 top-[66px] bg-slate-950/30 backdrop-blur-xs z-30 transition-opacity duration-200"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Navigation Drawer / Panel */}
      <div
        id="mobile-navigation-menu"
        role="dialog"
        aria-label="Mobile Navigation Menu"
        aria-modal="true"
        className={`md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200/90 shadow-2xl transition-all duration-300 ease-out z-40 origin-top overflow-hidden ${
          isMobileMenuOpen
            ? 'opacity-100 translate-y-0 max-h-[calc(100vh-66px)] overflow-y-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none max-h-0'
        }`}
      >
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Mobile status banner */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50 border border-emerald-100/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Wind className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  India Air Quality Monitor
                </p>
                <p className="text-[11px] text-slate-500">
                  CPCB & OpenAQ Live Feed
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-700 border border-emerald-200/70 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ACTIVE
            </span>
          </div>

          {/* Navigation Links List */}
          <nav className="space-y-1.5" aria-label="Mobile menu links">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `group flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 shadow-xs'
                      : 'bg-white hover:bg-slate-50/80 border-slate-100 text-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs shadow-emerald-500/20'
                            : `${item.badgeColor} group-hover:scale-105`
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold tracking-tight ${
                              isActive ? 'text-emerald-900' : 'text-slate-900'
                            }`}
                          >
                            {item.mobileTitle}
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-200/70 text-emerald-800">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${
                        isActive
                          ? 'text-emerald-600 translate-x-0.5'
                          : 'text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Quick helpful footer info inside drawer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Clean air insights & advisories</span>
            </span>
            <span className="font-medium text-slate-500">v1.2</span>
          </div>
        </div>
      </div>
    </header>
  );
}
