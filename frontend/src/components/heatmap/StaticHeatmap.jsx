import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import { getHeatmapTileUrl } from '../../api/airQuality';

/**
 * Static India Pollution Heat Map Component.
 *
 * Requirements fulfilled:
 * - Displays India at an appropriate initial size.
 * - Completely static (dragging, scroll-zoom, touch-zoom, double-click-zoom disabled).
 * - No zoom functionality (minZoom: 4, maxZoom: 4, zoomControl: false).
 * - No interactions that trigger additional tile requests.
 * - Loads all required tiles for the fixed India extent.
 * - Shows loading state during tile fetch and error state on failure.
 */
export default function StaticHeatmap({ metric }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatmapLayerRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [retryNonce, setRetryNonce] = useState(0);

  // Initialize static Leaflet map once on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center coordinates for India extent: ~22.8° N, 79.6° E
    const indiaCenter = [22.8, 79.6];
    const fixedZoom = 4;

    const map = L.map(mapContainerRef.current, {
      center: indiaCenter,
      zoom: fixedZoom,
      minZoom: fixedZoom,
      maxZoom: fixedZoom,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: true,
    });

    // Clean white/light base cartography for clear contrast under heat map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
      subdomains: 'abcd',
      minZoom: fixedZoom,
      maxZoom: fixedZoom,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update heatmap layer whenever metric or retryNonce changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);

    // Remove existing heatmap layer if present
    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    const tileUrl = getHeatmapTileUrl(metric);

    // Create the proxy tile layer
    const layer = L.tileLayer(tileUrl, {
      opacity: 0.72,
      tileSize: 256,
      minZoom: 4,
      maxZoom: 4,
      attribution: 'Air Quality &copy; Google',
    });

    let failedTileCount = 0;

    layer.on('loading', () => {
      setIsLoading(true);
      failedTileCount = 0;
    });

    layer.on('load', () => {
      setIsLoading(false);
      if (failedTileCount > 0) {
        setHasError(true);
        setErrorMessage('Some heat map tiles could not be loaded. Please check backend connection.');
      }
    });

    layer.on('tileerror', (error) => {
      failedTileCount++;
      console.warn('[StaticHeatmap] Tile error:', error);
      setIsLoading(false);
      setHasError(true);
      setErrorMessage('Failed to load Google heat map tiles through the backend.');
    });

    layer.addTo(map);
    heatmapLayerRef.current = layer;

    return () => {
      if (map && layer) {
        map.removeLayer(layer);
      }
    };
  }, [metric, retryNonce]);

  const handleRetry = () => {
    setRetryNonce((n) => n + 1);
  };

  return (
    <div className="relative w-full rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      {/* Static map container */}
      <div
        ref={mapContainerRef}
        className="w-full h-[520px] sm:h-[620px] bg-slate-50 relative z-0"
        style={{ cursor: 'default' }}
      />

      {/* Floating map status badge */}
      <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm border border-gray-200/80 rounded-lg px-2.5 py-1.5 shadow-sm flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-[11px] font-medium text-gray-700">
          Fixed India Extent (Static View)
        </span>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3 shadow-sm">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-gray-800">
            Loading heat map tiles…
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Fetching India air quality layer via backend cache
          </p>
        </div>
      )}

      {/* Error state overlay */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 mb-1">
            Unable to display heat map
          </h4>
          <p className="text-xs text-gray-600 max-w-sm mb-4">
            {errorMessage || 'There was an issue fetching the heat map tiles.'}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Loading</span>
          </button>
        </div>
      )}
    </div>
  );
}
