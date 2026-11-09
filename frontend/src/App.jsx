import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import HeatMap from './pages/HeatMap';

/**
 * Main application router for Breathe Better.
 * Route / -> Page 1: Dashboard (Stages 1, 2, 3)
 * Route /map -> Page 2: Pollution Heat Map (Stage 4)
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/map" element={<HeatMap />} />
        <Route path="/heatmap" element={<Navigate to="/map" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
