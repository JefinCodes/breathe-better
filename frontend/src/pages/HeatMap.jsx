import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, RefreshCw, ShieldAlert } from 'lucide-react';

import { getHeatmapMetadata } from '../api/airQuality';
import Navbar from '../components/Navbar';
import MetricSelector from '../components/heatmap/MetricSelector';
import StaticHeatmap from '../components/heatmap/StaticHeatmap';
import HeatmapLegend from '../components/heatmap/HeatmapLegend';

/**
 * Page 2: Pollution Heat Map.
 *
 * Requirements:
 * - Displays India pollution heat map using Google Air Quality API tiles.
 * - Leaflet map locked to static India extent without zoom controls or gesture requests.
 * - Metric selector offering Universal AQI and PM2.5.
 * - Mentions Universal AQI explicitly.
 * - Shows last heat map update time from backend.
 * - Dynamic metric legend matching the active layer.
 * - Responsive white-background layout.
 */
export default function HeatMap() {
  const [selectedMetric, setSelectedMetric] = useState('UAQI_RED_GREEN');

  // TanStack Query for heat map freshness metadata
  const metadataQuery = useQuery({
    queryKey: ['heatmap', 'metadata'],
    queryFn: getHeatmapMetadata,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });

  const metadata = metadataQuery.data?.data;

  // Format the last update time string in IST
  const formatTime = (timeStr) => {
    if (!timeStr) return 'Hourly';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) + ' IST';
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sticky top navigation */}
      <Navbar
        rightContent={
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Google API Live Tiles</span>
          </div>
        }
      />

      {/* Main page content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
        {/* Page Title & Freshness Bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-gray-200/70">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              India Pollution Heat Map
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Hourly continuous air quality overlay across India powered by Google Air Quality tiles.
            </p>
          </div>

          {/* Last heat map update time */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2 shadow-xs shrink-0 self-start sm:self-auto">
            <Clock className="w-4 h-4 text-blue-600" />
            <div className="text-left">
              <div className="text-[10px] uppercase font-semibold text-gray-400 leading-tight">
                Last Google Model Update
              </div>
              <div className="text-xs font-bold text-gray-800">
                {metadataQuery.isLoading ? (
                  <span className="text-gray-400">Loading…</span>
                ) : metadata?.lastUpdateTime ? (
                  `${formatTime(metadata.lastUpdateTime)}`
                ) : (
                  'Hourly on the hour'
                )}
              </div>
            </div>
            {metadataQuery.isFetching && (
              <RefreshCw className="w-3 h-3 text-blue-500 animate-spin ml-1" />
            )}
          </div>
        </div>

        {/* Metric Selector */}
        <MetricSelector
          selectedMetric={selectedMetric}
          onSelectMetric={setSelectedMetric}
        />

        {/* Static Map Card */}
        <div className="space-y-3">
          <StaticHeatmap metric={selectedMetric} />
        </div>

        {/* Dynamic Metric Legend */}
        <HeatmapLegend metric={selectedMetric} />

        {/* Informational Footer Note */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-xs text-gray-500 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Heat map tiles are rendered from the official Google Air Quality Tile API and cached on the backend in accordance with Google&apos;s 1-hour model update cycle. The India extent is fixed to prevent unnecessary tile queries.
          </p>
        </div>
      </main>
    </div>
  );
}
