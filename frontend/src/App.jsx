import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import HeatMap from './pages/HeatMap';
import LocationComparison from './pages/LocationComparison';
import HistoricalTracker from './pages/HistoricalTracker';

/**
 * Main application router for Breathe Better.
 * Route / -> Page 1: Dashboard (Stages 1, 2, 3)
 * Route /map -> Page 2: Pollution Heat Map (Stage 4)
 * Route /compare -> Page 3: Location Comparison (Stage 5)
 * Route /history -> Page 4: Historical Pollution Tracker (Stage 6)
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/map" element={<HeatMap />} />
        <Route path="/heatmap" element={<Navigate to="/map" replace />} />
        <Route path="/compare" element={<LocationComparison />} />
        <Route path="/history" element={<HistoricalTracker />} />
        <Route path="/historical" element={<Navigate to="/history" replace />} />
        <Route path="/tracker" element={<Navigate to="/history" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
