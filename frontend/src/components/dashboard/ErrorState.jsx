import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Full-width error card with a retry button.
 * Props:
 *   message  — human-readable error string
 *   onRetry  — callback to trigger a re-fetch
 */
export default function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6 text-red-400" />
      </div>
      <p className="text-sm font-semibold text-gray-800 mb-1">
        Could not load air quality data
      </p>
      <p className="text-xs text-gray-500 mb-5 max-w-xs mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      )}
    </div>
  );
}
