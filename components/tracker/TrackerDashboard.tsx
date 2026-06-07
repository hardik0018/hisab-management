'use client';

/**
 * TrackerDashboard.tsx
 * Top-level client layout assembling all tracker sub-components.
 * Must be rendered inside <TrackerProvider>.
 */

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { TrackerStatusBadge } from './TrackerStatusBadge';
import { TrackerStatsGrid } from './TrackerStatsGrid';
import { TrackerMap } from './TrackerMap';
import { TrackerOfflineWarning } from './TrackerOfflineWarning';
import { TrackerSSEStatus } from './TrackerSSEStatus';
import { TrackerSessionInfo } from './TrackerSessionInfo';

export function TrackerDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-5">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Live Tracker</h1>
              <p className="text-xs text-muted-foreground">Real-time GPS tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrackerSSEStatus />
            <TrackerStatusBadge />
          </div>
        </motion.div>

        {/* ── Offline Warning ─────────────────────────────────────────────── */}
        <TrackerOfflineWarning />

        {/* ── Stats Grid ──────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Current Stats
          </h2>
          <TrackerStatsGrid />
        </section>

        {/* ── Map ─────────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Route Map
          </h2>
          <TrackerMap className="h-[400px]" />
        </section>

        {/* ── Session Info ─────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Session Details
          </h2>
          <TrackerSessionInfo />
        </section>
      </div>
    </div>
  );
}
