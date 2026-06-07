'use client';

/**
 * TrackerSessionInfo.tsx
 * Card showing the current session metadata: ID, start time, stop time, point count.
 */

import { motion } from 'framer-motion';
import { CalendarClock, StopCircle, Hash, MapPin } from 'lucide-react';
import { useTrackerContext } from './TrackerProvider';

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground font-mono truncate max-w-[180px]">
        {value}
      </span>
    </div>
  );
}

function formatDateTime(ts: Date | string | null | undefined): string {
  if (!ts) return '—';
  try {
    return new Date(ts as string).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

export function TrackerSessionInfo() {
  const { latest } = useTrackerContext();

  if (!latest?.sessionId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground"
      >
        <MapPin className="h-8 w-8 opacity-30" />
        <p className="text-sm">No active session</p>
        <p className="text-xs opacity-70">Start a session from your Android app to begin tracking</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-4"
    >
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
        Session Info
      </h3>

      <InfoRow
        icon={Hash}
        label="Session ID"
        value={latest.sessionId}
      />
      <InfoRow
        icon={CalendarClock}
        label="Started"
        value={formatDateTime(null)} // No startedAt in latest, shown separately
      />
      {latest.status === 'stopped' && (
        <InfoRow
          icon={StopCircle}
          label="Stopped"
          value={formatDateTime(latest.lastUpdatedAt)}
        />
      )}
      <InfoRow
        icon={Hash}
        label="Points Received"
        value={latest.lastSequence != null ? String(latest.lastSequence + 1) : '0'}
      />
      <InfoRow
        icon={MapPin}
        label="Coordinates"
        value={
          latest.lat != null && latest.lng != null
            ? `${latest.lat.toFixed(6)}, ${latest.lng.toFixed(6)}`
            : '—'
        }
      />
    </motion.div>
  );
}
