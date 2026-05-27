'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import ExpenseTopTabs from '@/components/expense/ExpenseTopTabs';
import ClearAllData from '@/components/settings/ClearAllData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Settings } from '@/types';
import { 
  Download, Settings2, Database, Table, FileSpreadsheet, FileText, Loader2 
} from 'lucide-react';
import { formatDisplayDate, formatDisplayTime } from '@/lib/date-utils';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [largeAmountLimit, setLargeAmountLimit] = useState<string>('');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
  
  // Export states
  const [exportScope, setExportScope] = useState<'month' | 'range' | 'all'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setLargeAmountLimit(String(data.settings.largeAmountLimit));
        setReminderEnabled(data.settings.backupReminder.enabled);
      } else {
        toast.error('Failed to load settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseInt(largeAmountLimit, 10);
    if (isNaN(limit) || limit <= 0) {
      toast.error('Large amount limit must be a positive number');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          largeAmountLimit: limit,
          backupReminder: {
            enabled: reminderEnabled,
            frequency: 'monthly',
            display: 'inside-app'
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        toast.success('Settings updated successfully!');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const params = new URLSearchParams();

    if (exportScope === 'month') {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      params.append('month', `${yyyy}-${mm}`);
    } else if (exportScope === 'all') {
      params.append('month', 'all');
    } else if (exportScope === 'range') {
      if (!startDate || !endDate) {
        toast.error('Please select both Start Date and End Date');
        return;
      }
      if (startDate > endDate) {
        toast.error('Start Date cannot be after End Date');
        return;
      }
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    }

    window.location.href = `/api/export/${format}?${params.toString()}`;
    toast.success(`Generating ${format.toUpperCase()} export...`);

    setTimeout(() => {
      fetchSettings();
    }, 1500);
  };

  const getBackupTime = () => {
    if (!settings || !settings.lastBackupAt) return 'Never';
    const parts = settings.lastBackupAt.split('T');
    const datePart = formatDisplayDate(parts[0]);
    const timePart = parts.length > 1 ? formatDisplayTime(settings.lastBackupAt) : '';
    return `${datePart} ${timePart}`.trim();
  };

  return (
    <PageWrapper>
      <ExpenseTopTabs />
      <div className="max-w-md mx-auto p-4 space-y-5 pb-32">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Settings</h2>
          <p className="text-xs text-slate-500 font-medium">Configure warnings, exports, and backup alerts for this space.</p>
        </div>

        {/* Preferences Form */}
        {isLoading ? (
          <div className="flex justify-center items-center py-10 text-indigo-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleUpdateSettings} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Settings2 className="w-4.5 h-4.5" />
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Preferences</h3>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="limit-input" className="text-xs font-semibold text-slate-400">
                Large Amount Warning Limit (₹)
              </Label>
              <Input
                id="limit-input"
                type="number"
                value={largeAmountLimit}
                onChange={(e) => setLargeAmountLimit(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 text-sm rounded-xl h-11"
              />
            </div>

            <div className="flex items-center justify-between gap-4 py-1">
              <div className="space-y-0.5">
                <Label htmlFor="reminder-toggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  In-App Backup Reminders
                </Label>
                <p className="text-[10px] text-slate-400">
                  Trigger alerts when backup age exceeds 30 days.
                </p>
              </div>
              <input
                id="reminder-toggle"
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-5 h-5 rounded-lg border-slate-300 bg-slate-50 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isUpdating}
              className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl border-0 shadow-lg shadow-indigo-500/10 transition-all cursor-pointer"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </form>
        )}

        {/* Data Export Center */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Download className="w-4.5 h-4.5" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Export Backups</h3>
          </div>

          <div className="flex items-center justify-between text-xs py-2 px-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              Last Backup:
            </span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {getBackupTime()}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Scope</span>
            <div className="grid grid-cols-3 gap-2">
              {['month', 'range', 'all'].map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => setExportScope(scope as any)}
                  className={cn(
                    "py-2 px-1 rounded-xl border text-[11px] font-bold transition-all",
                    exportScope === scope
                      ? "bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-400"
                      : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-350"
                  )}
                >
                  {scope === 'month' ? 'Current Month' : scope === 'range' ? 'Custom Range' : 'All Data'}
                </button>
              ))}
            </div>
          </div>

          {exportScope === 'range' && (
            <div className="grid grid-cols-2 gap-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-3.5 rounded-2xl animate-in slide-in-from-top-1">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-900 text-slate-800 dark:text-slate-200 text-xs rounded-xl h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-900 text-slate-800 dark:text-slate-200 text-xs rounded-xl h-9"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Download Format</span>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                onClick={() => handleExport('csv')}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 h-11 rounded-xl font-bold flex flex-col gap-0.5 justify-center items-center cursor-pointer"
              >
                <Table className="w-4 h-4 text-emerald-500" />
                <span className="text-[9px] uppercase font-black">CSV</span>
              </Button>
              <Button
                type="button"
                onClick={() => handleExport('excel')}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 h-11 rounded-xl font-bold flex flex-col gap-0.5 justify-center items-center cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                <span className="text-[9px] uppercase font-black">Excel</span>
              </Button>
              <Button
                type="button"
                onClick={() => handleExport('pdf')}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 h-11 rounded-xl font-bold flex flex-col gap-0.5 justify-center items-center cursor-pointer"
              >
                <FileText className="w-4 h-4 text-rose-500" />
                <span className="text-[9px] uppercase font-black">PDF</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <ClearAllData />

      </div>
    </PageWrapper>
  );
}
