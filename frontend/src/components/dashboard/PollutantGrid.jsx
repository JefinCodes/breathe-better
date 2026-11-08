import PollutantCard from './PollutantCard';

/**
 * Priority display order for the pollutant grid.
 * Pollutants not in this list are appended at the end.
 */
const PRIORITY = ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co', 'no', 'nh3'];

/**
 * Responsive grid of PollutantCards.
 * 2 columns on mobile → 3 columns on sm+ screens.
 *
 * Props:
 *   pollutants — array of pollutant objects from the backend
 */
export default function PollutantGrid({ pollutants }) {
  if (!pollutants || pollutants.length === 0) return null;

  const sorted = [...pollutants].sort((a, b) => {
    const ia = PRIORITY.indexOf(a.code);
    const ib = PRIORITY.indexOf(b.code);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return (
    <section>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Pollutants
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sorted.map((p) => (
          <PollutantCard key={p.code} pollutant={p} />
        ))}
      </div>
    </section>
  );
}
