/**
 * Full-page loading skeleton shown while air quality data is in-flight.
 * Uses Tailwind's animate-pulse to signal loading state.
 */
export default function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Timestamp bar */}
      <div className="h-4 bg-gray-100 rounded w-56" />

      {/* AQI summary card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-8">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-4 flex-1">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-gray-100 rounded w-24" />
                <div className="h-5 bg-gray-100 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pollutant section label */}
      <div className="h-3 bg-gray-100 rounded w-20" />

      {/* Pollutant cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 h-24" />
        ))}
      </div>

      {/* Health advisory placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <div className="h-3 bg-gray-100 rounded w-28" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
