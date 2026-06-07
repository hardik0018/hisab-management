'use client';

/**
 * TrackerSSEStatus.tsx
 * Small connection status indicator (bottom-right corner of the map card).
 * Only rendered when SSE is not fully connected.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTrackerContext } from './TrackerProvider';

export function TrackerSSEStatus() {
  const { sseStatus } = useTrackerContext();

  const isVisible = sseStatus === 'connecting' || sseStatus === 'disconnected' || sseStatus === 'error';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/30 text-blue-500 dark:text-blue-400"
        >
          {sseStatus === 'error' ? (
            <AlertCircle className="h-3 w-3 text-destructive" />
          ) : (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          {sseStatus === 'error' ? 'Stream error' : 'Reconnecting…'}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
