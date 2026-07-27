'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getOfflineQueueCount, syncOfflineExpenses } from '@/lib/offline-queue';
import { WifiOff, RefreshCw, Smartphone, Share2, PlusSquare, X } from 'lucide-react';

export default function PwaManager() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [showIosHint, setShowIosHint] = useState<boolean>(false);

  const handleSync = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      const { synced, failed } = await syncOfflineExpenses();
      if (synced > 0) {
        toast.success(`🌐 Back Online: Successfully synced ${synced} offline expense record${synced > 1 ? 's' : ''}!`);
        router.refresh();
      }
      if (failed > 0) {
        toast.error(`⚠️ Could not sync ${failed} offline record(s). Will retry automatically.`);
      }
    } catch (err) {
      console.error('[PWA_SYNC_ERROR]', err);
    } finally {
      setIsSyncing(false);
      const updatedCount = await getOfflineQueueCount();
      setQueueCount(updatedCount);
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Service Worker Registration
    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('[PWA] Service Worker active:', reg.scope))
          .catch((err) => console.error('[PWA] SW registration error:', err));
      };
      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    // 2. Initial network & queue status
    setIsOnline(navigator.onLine);
    getOfflineQueueCount().then((count) => {
      setQueueCount(count);
      if (navigator.onLine && count > 0) {
        handleSync();
      }
    });

    // 3. Event Listeners for Network & Queue
    const handleOnline = () => {
      setIsOnline(true);
      toast.info('🌐 Internet connection restored.');
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('📴 You are offline. Expenses will be queued locally.');
    };

    const handleQueueUpdate = (e: any) => {
      if (e && e.detail && typeof e.detail.count === 'number') {
        setQueueCount(e.detail.count);
      } else {
        getOfflineQueueCount().then(setQueueCount);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-updated', handleQueueUpdate);

    // 4. Install Prompt Interception (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const isDismissed = localStorage.getItem('hisab_pwa_install_dismissed');
      if (!isDismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. iOS Safari Detection & Hint
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    const isIosDismissed = localStorage.getItem('hisab_pwa_ios_dismissed');

    if (isIosDevice && !isStandaloneMode && !isIosDismissed) {
      // Small delay before showing iOS hint so it doesn't overwhelm on immediate load
      const timer = setTimeout(() => setShowIosHint(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('offline-queue-updated', handleQueueUpdate);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-updated', handleQueueUpdate);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [handleSync]);

  const triggerInstallPrompt = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('🎉 Thank you for installing Hisab Expense Tracker!');
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    } else {
      console.log('[PWA] User dismissed install prompt');
    }
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem('hisab_pwa_install_dismissed', 'true');
  };

  const dismissIosHint = () => {
    setShowIosHint(false);
    localStorage.setItem('hisab_pwa_ios_dismissed', 'true');
  };

  return (
    <>
      {/* 1. Offline & Sync Status Pill (Fixed bottom-left) */}
      {(!isOnline || queueCount > 0 || isSyncing) && (
        <div className="fixed bottom-6 left-6 z-[60] animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="bg-popover/95 backdrop-blur-md border border-border shadow-2xl rounded-full px-4 py-2.5 flex items-center gap-3 text-xs font-bold text-popover-foreground">
            {!isOnline ? (
              <>
                <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <WifiOff className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Offline Mode</span>
                {queueCount > 0 && (
                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px]">
                    {queueCount} Queued
                  </span>
                )}
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
                <span>Syncing {queueCount} offline item{queueCount > 1 ? 's' : ''}...</span>
              </>
            ) : queueCount > 0 ? (
              <>
                <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-ping shrink-0" />
                <span>{queueCount} item{queueCount > 1 ? 's' : ''} waiting to sync</span>
                <button
                  onClick={handleSync}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-2.5 py-1 rounded-full text-[10px] transition-colors ml-1"
                >
                  Sync Now
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* 2. Android/Chrome PWA Install Banner — top bar */}
      {showInstallBanner && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-md z-[300] animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="relative overflow-hidden flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.45)] rounded-2xl px-3.5 py-3">

            {/* Gradient blob */}
            <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-gradient-to-br from-primary/25 to-violet-400/10 blur-2xl pointer-events-none" />

            {/* Icon */}
            <div className="relative shrink-0">
              <span className="absolute inset-0 rounded-xl bg-primary/20 animate-ping" style={{ animationDuration: '2.6s' }} />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-md shadow-primary/30">
                <Smartphone className="w-4.5 h-4.5 text-white" />
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-foreground leading-tight">Install Hisab App</p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">Offline access · 1-tap from home screen</p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={dismissInstallBanner}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground hover:bg-muted/70 transition-colors"
              >
                Later
              </button>
              <button
                onClick={triggerInstallPrompt}
                className="px-3.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-gradient-to-r from-primary to-violet-600 shadow-sm shadow-primary/30 hover:brightness-110 transition-all active:scale-95"
              >
                Install
              </button>
              <button
                onClick={dismissInstallBanner}
                className="p-1 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors ml-0.5"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. iOS Safari Install Hint Banner — top bar */}
      {showIosHint && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-md z-[300] animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.45)] rounded-2xl px-3.5 py-3">

            <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/25 to-sky-400/10 blur-2xl pointer-events-none" />

            {/* Header row */}
            <div className="flex items-center gap-3 relative">
              <div className="relative shrink-0">
                <span className="absolute inset-0 rounded-xl bg-indigo-400/20 animate-ping" style={{ animationDuration: '2.6s' }} />
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-500/30">
                  <Smartphone className="w-4.5 h-4.5 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-foreground leading-tight">Add to Home Screen</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">iPhone / iPad — offline, full-screen access</p>
              </div>

              <button
                onClick={dismissIosHint}
                className="p-1 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Steps row */}
            <div className="flex gap-2 mt-2.5">
              <div className="flex-1 flex items-center gap-2 bg-muted/50 border border-border/50 rounded-xl px-2.5 py-2">
                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">1</span>
                <span className="text-[10px] text-muted-foreground">
                  Tap <strong className="text-foreground">Share</strong> <Share2 className="w-3 h-3 inline text-indigo-500" />
                </span>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-muted/50 border border-border/50 rounded-xl px-2.5 py-2">
                <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-black shrink-0">2</span>
                <span className="text-[10px] text-muted-foreground">
                  <strong className="text-foreground">Add to Home</strong> <PlusSquare className="w-3 h-3 inline text-indigo-500" />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
