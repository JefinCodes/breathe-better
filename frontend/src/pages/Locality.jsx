import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Users,
  Compass,
  Sparkles,
  ArrowRight,
  LogOut,
  Sliders,
  Activity,
  Layers,
  Info,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import LocalityAuthModal from '../components/locality/LocalityAuthModal';
import LocalitySetupModal from '../components/locality/LocalitySetupModal';
import LocalityAqiTab from '../components/locality/LocalityAqiTab';
import LocalityMapTab from '../components/locality/LocalityMapTab';
import PopularThreadsSection from '../components/locality/PopularThreadsSection';
import CreateThreadSection from '../components/locality/CreateThreadSection';
import {
  getStoredUser,
  getMe,
  clearLocalityAuth,
  getThreads,
  getMyThreads,
} from '../api/locality';

export default function Locality() {
  const queryClient = useQueryClient();

  // Local state for user and locality
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const [activeDashboardTab, setActiveDashboardTab] = useState('aqi'); // 'aqi' | 'map'
  const [selectedThread, setSelectedThread] = useState(null);

  // Modal visibility states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  // Fetch current user details & saved locality if token is stored
  const userQuery = useQuery({
    queryKey: ['locality', 'me'],
    queryFn: getMe,
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (userQuery.data?.user) {
      setCurrentUser(userQuery.data.user);
    }
  }, [userQuery.data]);

  const locality = currentUser?.locality || null;

  // Fetch threads for current locality (or default India center if locality is not set yet)
  const threadsQuery = useQuery({
    queryKey: [
      'locality',
      'threads',
      locality?.latitude || 28.6139,
      locality?.longitude || 77.209,
      locality?.radius_km || 50,
    ],
    queryFn: () =>
      getThreads({
        latitude: locality?.latitude || 28.6139,
        longitude: locality?.longitude || 77.209,
        radiusKm: locality?.radius_km || 50,
      }),
    staleTime: 60 * 1000,
  });

  // Fetch threads created by this user
  const myThreadsQuery = useQuery({
    queryKey: ['locality', 'my-threads', currentUser?.id],
    queryFn: getMyThreads,
    enabled: !!currentUser,
    staleTime: 60 * 1000,
  });

  const threads = threadsQuery.data?.threads || [];
  const myThreads = myThreadsQuery.data?.threads || [];

  const handleRefreshData = useCallback(() => {
    threadsQuery.refetch();
    if (currentUser) {
      myThreadsQuery.refetch();
    }
  }, [threadsQuery, myThreadsQuery, currentUser]);

  const handleSignOut = () => {
    clearLocalityAuth();
    setCurrentUser(null);
    queryClient.removeQueries({ queryKey: ['locality'] });
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    queryClient.invalidateQueries({ queryKey: ['locality'] });
    if (!user.locality) {
      // Prompt user to set up locality right after signing in/up
      setTimeout(() => setIsSetupModalOpen(true), 300);
    }
  };

  const handleLocalitySaved = (newLocality) => {
    setCurrentUser((prev) => (prev ? { ...prev, locality: newLocality } : prev));
    queryClient.invalidateQueries({ queryKey: ['locality'] });
    queryClient.invalidateQueries({ queryKey: ['airQuality'] });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-20">
        {/* Page Hero & Header Banner */}
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-4 sm:p-6 md:p-8 shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/20 text-emerald-400 text-xs font-bold tracking-wide">
                <Users className="w-3.5 h-3.5" />
                <span>HYPER-LOCAL COMMUNITY ACTION</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Turn Awareness into Action
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Mark your locality, track atmospheric changes over time, pin pollution source hotspots,
                and lead community discussions to minimize emissions neighborhood by neighborhood.
              </p>
            </div>

            {/* User Profile / Auth Action Card */}
            <div className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col gap-2.5">
              {currentUser ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {currentUser.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        @{currentUser.username}
                      </span>
                      <span className="text-[10px] text-slate-300">
                        {currentUser.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsSetupModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>{locality ? 'Change Locality' : 'Set Locality'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="px-2.5 py-1 rounded-lg hover:bg-red-500/20 text-red-300 text-[11px] font-semibold transition-colors flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-center sm:text-left">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 justify-center sm:justify-start">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Join Your Neighborhood</span>
                  </span>
                  <p className="text-[11px] text-slate-300 max-w-[200px]">
                    Sign in to set your locality, create pollution threads, and post messages.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Sign In / Create Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Locality Setup Callout (If user is signed in but has not configured locality yet) */}
        {currentUser && !locality && (
          <div className="p-5 sm:p-6 bg-emerald-50 rounded-3xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  Set Up Your Locality Coordinates & Radius
                </h3>
                <p className="text-xs text-emerald-800/80 mt-0.5 max-w-lg">
                  Select your center point via device GPS, city search, or interactive map drag, and choose your watch radius to activate live local telemetry and community discussion pins.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSetupModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 flex-shrink-0"
            >
              <Compass className="w-4 h-4" />
              <span>Configure Locality</span>
            </button>
          </div>
        )}

        {/* Guest Preview Prompt (If user is not signed in) */}
        {!currentUser && (
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                Exploring as a visitor. Sign in or create an account to personalize your locality, post messages, and pin pollution sources.
              </span>
            </span>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="font-bold text-emerald-700 hover:text-emerald-800 flex-shrink-0 underline"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Locality Status & Active Tabs Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {locality ? (
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-800">
                Active Locality: <strong className="text-emerald-700">{locality.locality_name}</strong>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                ({locality.latitude.toFixed(3)}° N, {locality.longitude.toFixed(3)}° E • {locality.radius_km} km)
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              Showing default national community view (New Delhi center). Configure locality for localized telemetry.
            </div>
          )}

          {/* Tab 1 (AQI & Forecast) vs Tab 2 (Locality Map & Community) Switcher */}
          <div className="flex items-center p-1 bg-slate-200/80 rounded-2xl self-start sm:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => setActiveDashboardTab('aqi')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 ${
                activeDashboardTab === 'aqi'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span className="sm:hidden">AQI &amp; 24h</span>
              <span className="hidden sm:inline">Locality AQI &amp; 24h Forecast</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDashboardTab('map')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 ${
                activeDashboardTab === 'map'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span className="sm:hidden">Map &amp; Pins</span>
              <span className="hidden sm:inline">Locality Map &amp; Community Pins</span>
              {threads.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-[10px] text-emerald-800 font-extrabold">
                  {threads.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1 Content: Compact Locality AQI, Pollutants & 24h Prediction Average */}
        {activeDashboardTab === 'aqi' && (
          <LocalityAqiTab
            locality={
              locality || {
                latitude: 28.6139,
                longitude: 77.209,
                locality_name: 'National Center (Default)',
                radius_km: 15,
              }
            }
          />
        )}

        {/* Tab 2 Content: Large Interactive Locality Map with Thread Pins & Heatmap */}
        {activeDashboardTab === 'map' && (
          <LocalityMapTab
            locality={
              locality || {
                latitude: 28.6139,
                longitude: 77.209,
                locality_name: 'National Center (Default)',
                radius_km: 15,
              }
            }
            threads={threads}
            currentUser={currentUser}
            selectedThread={selectedThread}
            onSelectThread={setSelectedThread}
            onRefreshThreads={handleRefreshData}
          />
        )}

        {/* Below the Map: Popular Threads in Locality & My Threads */}
        <PopularThreadsSection
          threads={threads}
          myThreads={myThreads}
          currentUser={currentUser}
          onSelectThread={(t) => {
            setSelectedThread(t);
            setActiveDashboardTab('map');
            window.scrollTo({ top: 320, behavior: 'smooth' });
          }}
          onRefresh={handleRefreshData}
        />

        {/* Below that: Mark a Pollution Source (Create Thread Form) */}
        <CreateThreadSection
          locality={
            locality || {
              latitude: 28.6139,
              longitude: 77.209,
              locality_name: 'National Center',
              radius_km: 15,
            }
          }
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onThreadCreated={(newThread) => {
            handleRefreshData();
            setSelectedThread(newThread);
            setActiveDashboardTab('map');
            window.scrollTo({ top: 320, behavior: 'smooth' });
          }}
        />
      </main>

      {/* Auth Modal */}
      <LocalityAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Locality Setup Modal */}
      <LocalitySetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        initialLocality={locality}
        onLocalitySaved={handleLocalitySaved}
      />
    </div>
  );
}
