import { cn, formatUnit } from '../../lib/utils';

/**
 * Display metadata for known pollutant codes.
 * Codes match what the Google Air Quality API returns.
 */
const POLLUTANT_META = {
  pm25: { label: 'PM2.5', desc: 'Fine particles (<2.5μm)' },
  pm10: { label: 'PM10', desc: 'Coarse particles (<10μm)' },
  o3:   { label: 'O₃',   desc: 'Ozone' },
  no2:  { label: 'NO₂',  desc: 'Nitrogen dioxide' },
  so2:  { label: 'SO₂',  desc: 'Sulfur dioxide' },
  co:   { label: 'CO',   desc: 'Carbon monoxide' },
  no:   { label: 'NO',   desc: 'Nitric oxide' },
  nh3:  { label: 'NH₃',  desc: 'Ammonia' },
};

/**
 * Card showing a single pollutant's concentration.
 * Never displays missing values as zero — shows "Not available" instead.
 *
 * Props:
 *   pollutant — pollutant object from the backend:
 *     { code, displayName, fullName, concentration: { value, units } }
 */
export default function PollutantCard({ pollutant }) {
  const meta = POLLUTANT_META[pollutant.code] || {
    label: pollutant.displayName || pollutant.code,
    desc: pollutant.fullName || '',
  };

  const value = pollutant.concentration?.value;
  const unit = formatUnit(pollutant.concentration?.units);
  const hasValue = value != null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between">
      {/* Header */}
      <div>
        <p className="text-sm font-bold text-gray-800">{meta.label}</p>
        <p className="text-xs text-gray-400 leading-tight mt-0.5">{meta.desc}</p>
      </div>

      {/* Value */}
      <div className="mt-3">
        {hasValue ? (
          <p className="text-gray-900">
            <span className="text-2xl font-bold">{value.toFixed(1)}</span>
            <span className={cn('text-xs ml-1', 'text-gray-500')}>{unit}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">Not available</p>
        )}
      </div>
    </div>
  );
}
