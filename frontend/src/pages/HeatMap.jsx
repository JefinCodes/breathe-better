import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';

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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5 pb-16">
        {/* Page Title & Last Update */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Pollution Heat Map
          </h1>

          {metadata?.lastUpdateTime && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-xs">
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

        {/* Static Map Card at Zoom 5 */}
        <StaticHeatmap metric={selectedMetric} />

        {/* Color Legend Bar */}
        <HeatmapLegend metric={selectedMetric} />
      </main>
    </div>
  );
}
