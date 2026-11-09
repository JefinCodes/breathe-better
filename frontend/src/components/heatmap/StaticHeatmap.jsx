import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getHeatmapTileUrl } from '../../api/airQuality';

/**
 * Static India Pollution Heat Map Component.
 *
 * - Locked to Zoom Level 5 for high-clarity India view.
 * - Uses clean OpenStreetMap tiles with zero "API KEY REQUIRED" watermarks.
 * - Interaction completely disabled (no zoom, pan, dragging, or gestures).
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

    // Center coordinates for India at Zoom 5: [22.5° N, 79.5° E]
    const indiaCenter = [22.5, 79.5];
    const fixedZoom = 5;

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

    // Standard OpenStreetMap tiles (no watermarks, no API key required)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      minZoom: fixedZoom,
      maxZoom: fixedZoom,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update heatmap overlay layer whenever metric or retryNonce changes
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
      opacity: 0.7,
      tileSize: 256,
      minZoom: 5,
      maxZoom: 5,
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
        setErrorMessage('Some heat map tiles could not be loaded.');
      }
    });

    layer.on('tileerror', (error) => {
      failedTileCount++;
      console.warn('[StaticHeatmap] Tile error:', error);
      setIsLoading(false);
      setHasError(true);
      setErrorMessage('Failed to load heat map tiles.');
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
      {/* Static map container at Zoom 5 */}
      <div
        ref={mapContainerRef}
        className="w-full h-[580px] sm:h-[680px] bg-slate-50 relative z-0"
        style={{ cursor: 'default' }}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-white/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3 shadow-sm">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-gray-800">
            Loading heat map…
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
