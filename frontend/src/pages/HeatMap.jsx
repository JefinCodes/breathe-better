import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Map, Clock } from 'lucide-react';

import { getHeatmapMetadata } from '../api/airQuality';
import Navbar from '../components/Navbar';
import MetricSelector from '../components/heatmap/MetricSelector';
import StaticHeatmap from '../components/heatmap/StaticHeatmap';
import HeatmapLegend from '../components/heatmap/HeatmapLegend';

export default function HeatMap() {
  const [selectedMetric, setSelectedMetric] = useState('UAQI_RED_GREEN');

  const metadataQuery = useQuery({
    queryKey: ['heatmap', 'metadata'],
    queryFn: getHeatmapMetadata,
    staleTime: 5 * 60 * 1000,
  });

  const metadata = metadataQuery.data?.data;

  const formatTime = (timeStr) => {
    if (!timeStr) return null;
    try {
      const date = new Date(timeStr);
      return (
        date.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }) + ' IST'
      );
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 pb-16">
        {/* Page Title & Last Update */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold tracking-wide">
              <Map className="w-3.5 h-3.5" />
              HEAT MAP
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Pollution Heat Map
            </h1>
          </div>

          {metadata?.lastUpdateTime && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-xs self-start sm:self-auto">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Updated {formatTime(metadata.lastUpdateTime)}</span>
            </div>
          )}
        </div>

        {/* Metric Selector (Universal AQI / PM2.5) */}
        <MetricSelector
          selectedMetric={selectedMetric}
          onSelectMetric={setSelectedMetric}
        />

        {/* Static Map Card (Zoom 4 on mobile, Zoom 5 on desktop) */}
        <StaticHeatmap metric={selectedMetric} />

        {/* Color Legend Bar */}
        <HeatmapLegend metric={selectedMetric} />
      </main>
    </div>
  );
}
