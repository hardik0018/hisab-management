'use client';

import React, { useState, useEffect } from 'react';
import { Settings } from '@/types';
import { BadgeAlert, Download, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

interface BackupReminderProps {
  settings: Settings | null;
}

export default function BackupReminder({ settings }: BackupReminderProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem('hisab_backup_reminder_dismissed');
      if (isDismissed === 'true') {
        setDismissed(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  if (!settings || !settings.backupReminder.enabled) return null;

  const { lastBackupAt } = settings;
  let showReminder = false;

  if (!lastBackupAt) {
    showReminder = true;
  } else {
    const backupDate = new Date(lastBackupAt);
    const diffTime = Math.abs(Date.now() - backupDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Show reminder if it's been more than 30 days
    if (diffDays >= 30) {
      showReminder = true;
    }
  }

  // Clear dismiss flag if a new backup is taken (diffDays < 30)
  if (lastBackupAt) {
    const backupDate = new Date(lastBackupAt);
    const diffTime = Math.abs(Date.now() - backupDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 30 && dismissed) {
      try {
        localStorage.removeItem('hisab_backup_reminder_dismissed');
      } catch (e) {}
    }
  }

  if (!showReminder || dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem('hisab_backup_reminder_dismissed', 'true');
    } catch (e) {}
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-3xl p-5 space-y-3 relative">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1.5 rounded-xl text-amber-500/60 hover:text-amber-300 hover:bg-amber-500/10 transition-all cursor-pointer"
        title="Dismiss reminder"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex gap-3 pr-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
          <BadgeAlert className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-amber-350">Backup Recommended</h3>
          <p className="text-xs text-slate-350 leading-relaxed">
            You haven't exported your expense data in over a month. Take a quick backup now to keep your records safe!
          </p>
        </div>
      </div>

      <Link
        href="/expenses/settings"
        className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 py-2.5 rounded-xl border border-amber-500/10 transition-all text-center w-full block cursor-pointer"
      >
        <Download className="w-4 h-4" />
        Go to Export Backups
        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
      </Link>
    </div>
  );
}
