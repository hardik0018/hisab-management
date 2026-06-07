'use client';

/**
 * TrackerStatusBadge.tsx
 * Animated status pill showing live/stopped/offline/reconnecting state.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Radio, RefreshCw } from 'lucide-react';
import { useTrackerContext } from './TrackerProvider';

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  containerClass: string;
  dotClass: string;
  pulse: boolean;
}

export function TrackerStatusBadge() {
  const { latest, sseStatus, isOffline } = useTrackerContext();

  const getConfig = (): StatusConfig => {
    if (sseStatus === 'connecting' || sseStatus === 'disconnected') {
      return {
        label: 'Reconnecting',
        icon: RefreshCw,
        containerClass: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        dotClass: 'bg-blue-400',
        pulse: false,
      };
    }

    if (isOffline || !latest) {
      return {
        label: 'Offline',
        icon: WifiOff,
        containerClass: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
        dotClass: 'bg-slate-400',
        pulse: false,
      };
    }

    if (latest.status === 'live') {
      return {
        label: 'Live',
        icon: Radio,
        containerClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        dotClass: 'bg-emerald-400',
        pulse: true,
      };
    }

    return {
      label: 'Stopped',
      icon: Wifi,
      containerClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      dotClass: 'bg-amber-400',
      pulse: false,
    };
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={config.label}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold tracking-widest uppercase ${config.containerClass}`}
      >
        {/* Animated dot */}
        <span className="relative flex h-2 w-2">
          {config.pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotClass}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotClass}`} />
        </span>

        <Icon
          className={`h-3 w-3 ${sseStatus === 'connecting' || sseStatus === 'disconnected' ? 'animate-spin' : ''}`}
        />
        {config.label}
      </motion.div>
    </AnimatePresence>
  );
}
