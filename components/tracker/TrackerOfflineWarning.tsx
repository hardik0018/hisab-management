'use client';

/**
 * TrackerOfflineWarning.tsx
 * Amber warning banner shown when the tracker has gone offline
 * (no updates received in the last 90 seconds).
 */

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useTrackerContext } from './TrackerProvider';

function timeAgo(ts: string | Date): string {
  const diffMs = Date.now() - new Date(ts as string).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
}

export function TrackerOfflineWarning() {
  const { latest, isOffline } = useTrackerContext();

  const lastSeen = latest?.lastUpdatedAt
    ? timeAgo(latest.lastUpdatedAt as string)
    : null;

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400"
        >
          <WifiOff className="h-4 w-4 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Tracker offline</p>
            <p className="text-xs opacity-80">
              {lastSeen
                ? `Last signal received ${lastSeen}. Showing last known location.`
                : 'No signal received. Waiting for Android device to connect.'}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
