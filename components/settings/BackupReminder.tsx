'use client';

import React from 'react';
import { Settings } from '@/types';
import { BadgeAlert, Download, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface BackupReminderProps {
  settings: Settings | null;
}

export default function BackupReminder({ settings }: BackupReminderProps) {
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

  if (!showReminder) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-3xl p-5 space-y-3">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
          <BadgeAlert className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-amber-300">Backup Recommended</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
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
