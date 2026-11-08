import { Clock } from 'lucide-react';
import { cn, formatISTTimestamp, getDataFreshness } from '../../lib/utils';

/**
 * Displays the observation timestamp and a colour-coded freshness badge.
 *
 * Props:
 *   timestamp — IST string returned by the backend (e.g. "2024-01-01T12:30:00+05:30")
 */
export default function TimestampBar({ timestamp }) {
  const freshness = getDataFreshness(timestamp);
  const formatted = formatISTTimestamp(timestamp);

  return (
    <div className="flex items-center justify-between text-xs text-gray-400">
      <span className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        Observed: <span className="text-gray-600 font-medium">{formatted}</span>
      </span>

      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', freshness.badgeCls)}>
        {freshness.label}
      </span>
    </div>
  );
}
