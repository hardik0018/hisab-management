/**
 * loading.tsx — Tracker page skeleton
 * Shown by Next.js App Router while the tracker page suspends.
 * Matches the layout of TrackerDashboard to prevent CLS.
 */

export default function TrackerLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-5">

        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-muted animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-5 w-32 bg-muted animate-pulse rounded-lg" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded-lg" />
            </div>
          </div>
          <div className="h-7 w-20 bg-muted animate-pulse rounded-full" />
        </div>

        {/* Stats grid skeleton */}
        <div className="space-y-3">
          <div className="h-3 w-24 bg-muted animate-pulse rounded-lg" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-muted animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Map skeleton */}
        <div className="space-y-3">
          <div className="h-3 w-20 bg-muted animate-pulse rounded-lg" />
          <div className="h-[400px] rounded-2xl bg-muted animate-pulse" />
        </div>

        {/* Session info skeleton */}
        <div className="space-y-3">
          <div className="h-3 w-28 bg-muted animate-pulse rounded-lg" />
          <div className="h-48 rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
