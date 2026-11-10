import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Compass,
  Search,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Navigation,
} from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { searchCities } from '../../api/cities';
import { setupLocality } from '../../api/locality';

// Custom SVG map marker icon
const createCenterIcon = () =>
  L.divIcon({
    className: 'custom-locality-center-pin',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 36px; height: 36px; background: rgba(16, 185, 129, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: 28px; height: 28px; background: #059669; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

export default function LocalitySetupModal({
  isOpen,
  onClose,
  initialLocality,
  onLocalitySaved,
}) {
  const [centerCoords, setCenterCoords] = useState(() => {
    if (initialLocality?.latitude && initialLocality?.longitude) {
      return { lat: initialLocality.latitude, lng: initialLocality.longitude };
    }
    // Default to New Delhi coordinates
    return { lat: 28.6139, lng: 77.209 };
  });

  const [radiusKm, setRadiusKm] = useState(initialLocality?.radius_km || 5);
  const [localityName, setLocalityName] = useState(initialLocality?.locality_name || '');
  const [activeTab, setActiveTab] = useState('gps'); // 'gps' | 'city' | 'manual'
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // City search state
  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [isSearchingCity, setIsSearchingCity] = useState(false);

  // Manual inputs
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // Geolocation hook
  const { detectLocation, status: geoStatus } = useGeolocation();

  // Leaflet references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  // Initialize or update coordinates when initialLocality changes
  useEffect(() => {
    if (initialLocality?.latitude && initialLocality?.longitude) {
      setCenterCoords({ lat: initialLocality.latitude, lng: initialLocality.longitude });
      setRadiusKm(initialLocality.radius_km || 5);
      setLocalityName(initialLocality.locality_name || '');
      setManualLat(String(initialLocality.latitude));
      setManualLng(String(initialLocality.longitude));
    }
  }, [initialLocality]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerCoords.lat, centerCoords.lng],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      // Draggable center pin
      const marker = L.marker([centerCoords.lat, centerCoords.lng], {
        icon: createCenterIcon(),
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        setCenterCoords({ lat: pos.lat, lng: pos.lng });
        setManualLat(pos.lat.toFixed(6));
        setManualLng(pos.lng.toFixed(6));
      });

      // Click anywhere on map to reposition center
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setCenterCoords({ lat, lng });
        setManualLat(lat.toFixed(6));
        setManualLng(lng.toFixed(6));
      });

      // Visual radius coverage circle
      const circle = L.circle([centerCoords.lat, centerCoords.lng], {
        radius: radiusKm * 1000,
        color: '#059669',
        fillColor: '#10b981',
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '5, 5',
      }).addTo(map);

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, [isOpen]);

  // Update marker and circle position when centerCoords or radiusKm change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const latlng = [centerCoords.lat, centerCoords.lng];

    if (markerRef.current) {
      markerRef.current.setLatLng(latlng);
    }

    if (circleRef.current) {
      circleRef.current.setLatLng(latlng);
      circleRef.current.setRadius(radiusKm * 1000);
    }

    mapInstanceRef.current.setView(latlng, mapInstanceRef.current.getZoom(), {
      animate: true,
    });
  }, [centerCoords, radiusKm]);

  // Handle GPS location click
  const handleUseMyLocation = async () => {
    setErrorMsg(null);
    const res = await detectLocation();
    if (res.success && res.coords) {
      setCenterCoords({ lat: res.coords.latitude, lng: res.coords.longitude });
      setManualLat(res.coords.latitude.toFixed(6));
      setManualLng(res.coords.longitude.toFixed(6));
      if (!localityName) {
        setLocalityName('My Current Location');
      }
    } else {
      setErrorMsg(res.error || 'Could not fetch device location. Please try city search.');
    }
  };

  // Handle City search
  useEffect(() => {
    if (!cityQuery || cityQuery.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCity(true);
      try {
        const results = await searchCities(cityQuery.trim());
        setCitySuggestions(results || []);
      } catch (err) {
        console.warn('City search failed', err);
      } finally {
        setIsSearchingCity(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [cityQuery]);

  const handleSelectCity = (city) => {
    setCenterCoords({ lat: city.latitude, lng: city.longitude });
    setLocalityName(`${city.name}, ${city.state || ''}`);
    setManualLat(city.latitude.toFixed(6));
    setManualLng(city.longitude.toFixed(6));
    setCitySuggestions([]);
    setCityQuery('');
  };

  // Handle Manual Coordinate Apply
  const handleApplyManual = (e) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setErrorMsg('Please enter valid coordinates: Latitude (-90 to 90), Longitude (-180 to 180).');
      return;
    }
    setErrorMsg(null);
    setCenterCoords({ lat, lng });
  };

  // Handle Save
  const handleSaveLocality = async () => {
    setErrorMsg(null);
    setIsSaving(true);

    try {
      const name = localityName.trim() || `Locality (${centerCoords.lat.toFixed(3)}, ${centerCoords.lng.toFixed(3)})`;
      const res = await setupLocality({
        localityName: name,
        latitude: centerCoords.lat,
        longitude: centerCoords.lng,
        radiusKm,
      });

      if (res.success) {
        onLocalitySaved(res.locality);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to save locality setup.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Configure Your Locality
              </h2>
              <p className="text-xs text-slate-500">
                Choose your center point and define your neighborhood tracking radius.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Two Columns */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* Left Column: Selection Controls */}
          <div className="lg:col-span-5 space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Locality Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                1. Locality Name / Area Label
              </label>
              <input
                type="text"
                value={localityName}
                onChange={(e) => setLocalityName(e.target.value)}
                placeholder="e.g. Indiranagar, Bengaluru or South Delhi"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Step 2: Coordinate Method Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Set Center Coordinates
              </label>
              <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl mb-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('gps')}
                  className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'gps'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>My GPS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('city')}
                  className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'city'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>City Search</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'manual'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Manual</span>
                </button>
              </div>

              {/* GPS Tab Content */}
              {activeTab === 'gps' && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <p className="text-xs text-emerald-950 mb-3 leading-relaxed">
                    Automatically detect your precise location using your device GPS and network signals.
                  </p>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={geoStatus === 'requesting'}
                    className="w-full py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    {geoStatus === 'requesting' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5" />
                    )}
                    <span>Detect My Current Location</span>
                  </button>
                </div>
              )}

              {/* City Search Tab Content */}
              {activeTab === 'city' && (
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={cityQuery}
                      onChange={(e) => setCityQuery(e.target.value)}
                      placeholder="Type Indian city (e.g. Bengaluru, Pune)..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {isSearchingCity && (
                      <Loader2 className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400 animate-spin" />
                    )}
                  </div>

                  {citySuggestions.length > 0 && (
                    <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {citySuggestions.map((c) => (
                        <li key={c.geonameid}>
                          <button
                            type="button"
                            onClick={() => handleSelectCity(c)}
                            className="w-full px-3 py-2 text-left hover:bg-emerald-50 flex items-center justify-between text-slate-700 transition-colors"
                          >
                            <span className="font-semibold text-slate-900">{c.name}</span>
                            <span className="text-[11px] text-slate-400">{c.state}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Manual Entry Tab Content */}
              {activeTab === 'manual' && (
                <form onSubmit={handleApplyManual} className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold uppercase">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                        placeholder="28.6139"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold uppercase">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={manualLng}
                        onChange={(e) => setManualLng(e.target.value)}
                        placeholder="77.2090"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
                  >
                    Apply Coordinates
                  </button>
                </form>
              )}
            </div>

            {/* Current Coordinates Indicator */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-center justify-between">
              <span className="font-medium">Selected Center:</span>
              <span className="font-mono text-slate-900 font-semibold text-[11px]">
                {centerCoords.lat.toFixed(5)}° N, {centerCoords.lng.toFixed(5)}° E
              </span>
            </div>

            {/* Step 3: Radius Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. Locality Radius</span>
                </label>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {radiusKm} km radius
                </span>
              </div>

              {/* Radius Quick Presets */}
              <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                {[2, 5, 10, 15, 25].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRadiusKm(val)}
                    className={`py-1 rounded-lg text-xs font-semibold border transition-all ${
                      radiusKm === val
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {val} km
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Drag the slider or click presets to expand your neighborhood watch boundary.
              </p>
            </div>
          </div>

          {/* Right Column: Live Interactive Map Preview */}
          <div className="lg:col-span-7 flex flex-col min-h-[260px] sm:min-h-[340px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Live Interactive Map Preview
              </span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium self-start sm:self-auto">
                Tip: Drag pin or click map to reposition
              </span>
            </div>

            <div className="flex-1 w-full rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner bg-slate-100 min-h-[240px] sm:min-h-[300px]">
              <div ref={mapContainerRef} className="w-full h-full min-h-[240px] sm:min-h-[320px] relative z-0" />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveLocality}
            disabled={isSaving}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Save & Set Locality</span>
          </button>
        </div>
      </div>
    </div>
  );
}
