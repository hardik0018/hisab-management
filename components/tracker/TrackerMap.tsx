'use client';

/**
 * TrackerMap.tsx
 * Leaflet map rendered client-side only (SSR disabled via dynamic import wrapper).
 * Shows route polylines grouped by sessionId, current position marker, and start marker.
 *
 * Rules:
 * - Never connects points from different sessions on the same polyline.
 * - Downsamples old session routes if > 500 points.
 * - Uses react-leaflet v4 with Leaflet 1.9.
 */

import dynamic from 'next/dynamic';

// Wrap the actual map in a dynamic import with ssr: false to prevent
// "window is not defined" errors during server rendering.
const TrackerMapInner = dynamic(() => import('./TrackerMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl bg-muted/40 animate-pulse flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Loading map…</span>
    </div>
  ),
});

interface TrackerMapProps {
  className?: string;
}

export function TrackerMap({ className }: TrackerMapProps) {
  return (
    <div className={`w-full rounded-2xl overflow-hidden border border-border ${className ?? ''}`}>
      <TrackerMapInner />
    </div>
  );
}
