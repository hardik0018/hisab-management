'use client';

/**
 * TrackerStatsGrid.tsx
 * Grid of stat cards showing speed, distance, battery, accuracy, etc.
 * All values come from TrackerContext — no direct API calls.
 */

import { motion } from 'framer-motion';
import {
  Gauge,
  TrendingUp,
  Route,
  Battery,
  Signal,
  Clock,
  Hash,
  Timer,
} from 'lucide-react';
import { useTrackerContext } from './TrackerProvider';


interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  index: number;
}

function StatCard({ icon: Icon, label, value, sub, highlight, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`relative flex flex-col gap-2 p-4 rounded-2xl border transition-all duration-300
        ${highlight
          ? 'bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30'
          : 'bg-card border-border dark:bg-slate-800/50'
        }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <Icon
          className={`h-4 w-4 ${highlight ? 'text-primary' : 'text-muted-foreground'}`}
        />
      </div>

      <motion.p
        key={value}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`text-2xl font-bold tracking-tight ${
          highlight ? 'text-primary' : 'text-foreground'
        }`}
      >
        {value}
      </motion.p>

      {sub && (
        <p className="text-xs text-muted-foreground truncate">{sub}</p>
      )}
    </motion.div>
  );
}

function formatDistance(metres: number | null): string {
  if (metres === null || metres === undefined) return '—';
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(2)} km`;
}

function formatSpeed(kmh: number | null): string {
  if (kmh === null || kmh === undefined) return '—';
  return `${kmh.toFixed(1)} km/h`;
}

function formatBattery(pct: number | null): string {
  if (pct === null || pct === undefined) return '—';
  return `${Math.round(pct)}%`;
}

function formatAccuracy(m: number | null): string {
  if (m === null || m === undefined) return '—';
  return `±${Math.round(m)} m`;
}

function formatLastUpdate(ts: Date | string | null): string {
  if (!ts) return '—';
  try {
    const diffMs = Date.now() - new Date(ts as string).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
  } catch {
    return '—';
  }
}

function formatTime(ts: Date | string | null): string {
  if (!ts) return '—';
  try {
    return new Date(ts as string).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

export function TrackerStatsGrid() {
  const { latest } = useTrackerContext();

  const stats: Omit<StatCardProps, 'index'>[] = [
    {
      icon: Gauge,
      label: 'Speed',
      value: formatSpeed(latest?.speedKmh ?? null),
      sub: latest?.serverSpeedKmh != null ? `Server: ${formatSpeed(latest.serverSpeedKmh)}` : undefined,
      highlight: true,
    },
    {
      icon: TrendingUp,
      label: 'Avg Speed',
      value: formatSpeed(latest?.avgSpeedKmh ?? null),
      sub: 'Moving segments only',
    },
    {
      icon: Route,
      label: 'Distance',
      value: formatDistance(latest?.totalDistanceM ?? null),
    },
    {
      icon: Battery,
      label: 'Battery',
      value: formatBattery(latest?.battery ?? null),
    },
    {
      icon: Signal,
      label: 'GPS Accuracy',
      value: formatAccuracy(latest?.accuracyM ?? null),
    },
    {
      icon: Clock,
      label: 'Last Update',
      value: formatLastUpdate(latest?.lastUpdatedAt ?? null),
    },
    {
      icon: Hash,
      label: 'Points',
      value: latest?.lastSequence != null ? String(latest.lastSequence + 1) : '—',
    },
    {
      icon: Timer,
      label: 'Session Start',
      value: formatTime(null), // populated via TrackerSessionInfo below
      sub: latest?.sessionId ? `ID: ${latest.sessionId.slice(0, 8)}…` : '—',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} {...stat} index={i} />
      ))}
    </div>
  );
}
