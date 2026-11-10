import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  PlusCircle,
  MapPin,
  Navigation,
  Compass,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { createThread } from '../../api/locality';

const createReportPinIcon = () =>
  L.divIcon({
    className: 'custom-report-pin',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 32px; height: 32px; background: rgba(239, 68, 68, 0.4); border-radius: 50%; animation: ping 1.5s infinite;"></span>
        <div style="width: 24px; height: 24px; background: #ef4444; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

export default function CreateThreadSection({
  locality,
  currentUser,
  onOpenAuth,
  onThreadCreated,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState({
    lat: locality.latitude,
    lng: locality.longitude,
  });

  const [locationMode, setLocationMode] = useState('center'); // 'center' | 'gps' | 'map'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const { detectLocation, status: geoStatus } = useGeolocation();

  // Leaflet references for pick-on-map
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Sync coords with locality when locality updates
  useEffect(() => {
    if (locality?.latitude && locality?.longitude && locationMode === 'center') {
      setCoords({ lat: locality.latitude, lng: locality.longitude });
    }
  }, [locality, locationMode]);

  // Leaflet preview map init for map picker mode
  useEffect(() => {
    if (locationMode !== 'map' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      const marker = L.marker([coords.lat, coords.lng], {
        icon: createReportPinIcon(),
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        setCoords({ lat: pos.lat, lng: pos.lng });
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setCoords({ lat, lng });
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [locationMode]);

  // Update marker when coords change
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([coords.lat, coords.lng]);
      mapInstanceRef.current.setView([coords.lat, coords.lng], mapInstanceRef.current.getZoom());
    }
  }, [coords]);

  // GPS detection handler
  const handleDetectGPS = async () => {
    setErrorMsg(null);
    const res = await detectLocation();
    if (res.success && res.coords) {
      setCoords({ lat: res.coords.latitude, lng: res.coords.longitude });
    } else {
      setErrorMsg(res.error || 'Failed to detect device location.');
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please enter both heading and description.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await createThread({
        title: title.trim(),
        description: description.trim(),
        latitude: coords.lat,
        longitude: coords.lng,
      });

      if (res.success) {
        setSuccessMsg('Pollution thread created and pinned on the locality map!');
        setTitle('');
        setDescription('');
        onThreadCreated(res.thread);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to report thread.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-5">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-emerald-600" />
          <span>Mark a Pollution Source Point</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Spot a local pollutant issue? Pin it on the map to alert neighbors and coordinate community action.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Thread Heading / Issue Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Open burning of garbage behind market complex"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Issue Description & Details
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you observed (time of day, smoke intensity, nearby landmarks, any health risks noticed)..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all leading-relaxed"
          />
        </div>

        {/* Location Coordinates Mode Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Pin Location on Map
          </label>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                setLocationMode('center');
                setCoords({ lat: locality.latitude, lng: locality.longitude });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                locationMode === 'center'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Use Locality Center</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLocationMode('gps');
                handleDetectGPS();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                locationMode === 'gps'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {geoStatus === 'requesting' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              <span>My Device GPS</span>
            </button>

            <button
              type="button"
              onClick={() => setLocationMode('map')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                locationMode === 'map'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Pick on Interactive Map</span>
            </button>
          </div>

          {/* Interactive Picker Map Canvas */}
          {locationMode === 'map' && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Click anywhere or drag the red pin to set the exact hotspot:</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {coords.lat.toFixed(5)}° N, {coords.lng.toFixed(5)}° E
                </span>
              </div>
              <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200">
                <div ref={mapContainerRef} className="w-full h-full" />
              </div>
            </div>
          )}

          {locationMode !== 'map' && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-[11px] flex items-center justify-between">
              <span>Target Pin Coordinates:</span>
              <span className="font-mono font-semibold text-slate-800">
                {coords.lat.toFixed(5)}° N, {coords.lng.toFixed(5)}° E
              </span>
            </div>
          )}
        </div>

        {/* Submit Action */}
        <div className="pt-2 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            {currentUser
              ? `Posting as @${currentUser.username}`
              : 'Sign in will be prompted to record under your username'}
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Publish Thread to Locality</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
