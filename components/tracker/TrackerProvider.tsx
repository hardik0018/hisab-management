'use client';

/**
 * TrackerProvider.tsx
 * React context providing live tracker state to all child components.
 *
 * Rules:
 * - Opens exactly ONE SSE connection per mounted provider tree.
 * - All UI components read from useTrackerContext() — no direct SSE.
 * - Closes SSE cleanly on unmount.
 * - Marks tracker as offline if lastUpdatedAt is older than 90 seconds.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { TrackerLatest } from '@/types';

const OFFLINE_THRESHOLD_MS = 90_000; // 90 seconds
const SSE_RECONNECT_DELAY_MS = 5_000; // 5 seconds

export type SSEConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface TrackerContextValue {
  latest: TrackerLatest | null;
  sseStatus: SSEConnectionStatus;
  isOffline: boolean;
}

const TrackerContext = createContext<TrackerContextValue | null>(null);

/**
 * Hook to consume tracker context.
 * Must be used inside <TrackerProvider>.
 */
export function useTrackerContext(): TrackerContextValue {
  const ctx = useContext(TrackerContext);
  if (!ctx) {
    throw new Error('useTrackerContext must be used inside <TrackerProvider>');
  }
  return ctx;
}

interface TrackerProviderProps {
  children: React.ReactNode;
  /** SSR-fetched initial state to hydrate the client immediately */
  initialLatest: TrackerLatest | null;
}

export function TrackerProvider({ children, initialLatest }: TrackerProviderProps) {
  const [latest, setLatest] = useState<TrackerLatest | null>(initialLatest);
  const [sseStatus, setSseStatus] = useState<SSEConnectionStatus>('connecting');
  const [isOffline, setIsOffline] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offlineTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Offline detection ──────────────────────────────────────────────────────
  const checkOffline = useCallback((currentLatest: TrackerLatest | null) => {
    if (!currentLatest?.lastUpdatedAt) {
      setIsOffline(false);
      return;
    }
    const lastUpdate = new Date(currentLatest.lastUpdatedAt as string).getTime();
    setIsOffline(Date.now() - lastUpdate > OFFLINE_THRESHOLD_MS);
  }, []);

  useEffect(() => {
    // Check offline status on interval
    offlineTimerRef.current = setInterval(() => {
      setLatest((prev) => {
        checkOffline(prev);
        return prev;
      });
    }, 10_000);

    return () => {
      if (offlineTimerRef.current) clearInterval(offlineTimerRef.current);
    };
  }, [checkOffline]);

  // ── SSE connection ─────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setSseStatus('connecting');

    const es = new EventSource('/api/tracker/stream');
    eventSourceRef.current = es;

    es.onopen = () => {
      setSseStatus('connected');
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    es.onerror = () => {
      setSseStatus('disconnected');
      es.close();
      eventSourceRef.current = null;
      // Auto-reconnect
      reconnectTimerRef.current = setTimeout(connect, SSE_RECONNECT_DELAY_MS);
    };

    // tracker:latest — received immediately on connect (seed data)
    es.addEventListener('tracker:latest', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as TrackerLatest | null;
        if (data) {
          setLatest(data);
          checkOffline(data);
        }
        setSseStatus('connected');
      } catch {
        console.error('[SSE] Failed to parse tracker:latest');
      }
    });

    // tracker:point — live location update
    es.addEventListener('tracker:point', (e: MessageEvent) => {
      try {
        const point = JSON.parse(e.data) as Partial<TrackerLatest> & {
          speedKmh?: number;
          lat?: number;
          lng?: number;
        };
        setLatest((prev) => {
          if (!prev) return prev;
          const updated: TrackerLatest = {
            ...prev,
            status: 'live',
            lat: point.lat ?? prev.lat,
            lng: point.lng ?? prev.lng,
            speedKmh: point.speedKmh ?? prev.speedKmh,
            serverSpeedKmh: point.serverSpeedKmh ?? prev.serverSpeedKmh,
            avgSpeedKmh: point.avgSpeedKmh ?? prev.avgSpeedKmh,
            totalDistanceM: point.totalDistanceM ?? prev.totalDistanceM,
            accuracyM: point.accuracyM ?? prev.accuracyM,
            battery: point.battery ?? prev.battery,
            lastSequence: point.lastSequence ?? prev.lastSequence,
            lastUpdatedAt: new Date().toISOString(),
          };
          checkOffline(updated);
          return updated;
        });
        setIsOffline(false);
      } catch {
        console.error('[SSE] Failed to parse tracker:point');
      }
    });

    // tracker:session-started
    es.addEventListener('tracker:session-started', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { sessionId: string; startedAt: string };
        setLatest((prev) => ({
          trackerId: 'main',
          sessionId: data.sessionId,
          status: 'live',
          lat: prev?.lat ?? null,
          lng: prev?.lng ?? null,
          speedKmh: null,
          serverSpeedKmh: null,
          avgSpeedKmh: 0,
          totalDistanceM: 0,
          accuracyM: null,
          battery: prev?.battery ?? null,
          lastSequence: -1,
          lastUpdatedAt: data.startedAt,
        }));
        setIsOffline(false);
      } catch {
        console.error('[SSE] Failed to parse tracker:session-started');
      }
    });

    // tracker:session-stopped
    es.addEventListener('tracker:session-stopped', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as {
          sessionId: string;
          stoppedAt: string;
          totalDistanceM?: number;
          avgSpeedKmh?: number;
        };
        setLatest((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: 'stopped',
            totalDistanceM: data.totalDistanceM ?? prev.totalDistanceM,
            avgSpeedKmh: data.avgSpeedKmh ?? prev.avgSpeedKmh,
            lastUpdatedAt: data.stoppedAt,
          };
        });
      } catch {
        console.error('[SSE] Failed to parse tracker:session-stopped');
      }
    });

    // tracker:heartbeat — keep-alive, no state update needed
    es.addEventListener('tracker:heartbeat', () => {
      setSseStatus('connected');
    });
  }, [checkOffline]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connect]);

  return (
    <TrackerContext.Provider value={{ latest, sseStatus, isOffline }}>
      {children}
    </TrackerContext.Provider>
  );
}
