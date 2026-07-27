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

      {/* 2. Android/Chrome PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-card/95 backdrop-blur-lg border border-border shadow-2xl rounded-3xl p-4.5 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className="text-sm font-bold text-foreground truncate">Install Hisab App</h4>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                  Add to your home screen for instant offline expense entry & 1-tap access!
                </p>
              </div>
            </div>
            <button
              onClick={dismissInstallBanner}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 mt-3.5 pt-3 border-t border-border/50">
            <button
              onClick={dismissInstallBanner}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Not Now
            </button>
            <button
              onClick={triggerInstallPrompt}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 py-1.5 rounded-xl shadow-sm hover:shadow transition-all"
            >
              Install App
            </button>
          </div>
        </div>
      )}

      {/* 3. iOS Safari Install Hint Banner */}
      {showIosHint && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-card/95 backdrop-blur-lg border border-border shadow-2xl rounded-3xl p-4.5 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-sm text-indigo-500">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className="text-sm font-bold text-foreground truncate">Install on iPhone / iPad</h4>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                  Get full-screen offline access right from your home screen!
                </p>
              </div>
            </div>
            <button
              onClick={dismissIosHint}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-muted/30 border border-border/50 rounded-2xl p-3 mt-3 text-xs text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center font-bold text-[10px] text-foreground shrink-0">1</span>
              <span>Tap the <strong className="text-foreground">Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-primary mb-0.5" /> in Safari toolbar.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center font-bold text-[10px] text-foreground shrink-0">2</span>
              <span>Select <strong className="text-foreground">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline text-primary mb-0.5" />.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
