'use client';

import React, { useEffect, useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import ExpenseTopTabs from '@/components/expense/ExpenseTopTabs';
import ExpenseEntryBox from '@/components/expense/ExpenseEntryBox';
import BackupReminder from '@/components/settings/BackupReminder';
import { Settings } from '@/types';

export default function ExpensesPage() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    };
    
    fetchSettings();
  }, []);

  return (
    <PageWrapper>
      <ExpenseTopTabs />
      <div className="max-w-md mx-auto p-4 space-y-5 pb-32">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Add Expenses</h2>
          <p className="text-xs text-slate-500 font-medium">Record daily outflows using bulk plain text entries.</p>
        </div>

        <BackupReminder settings={settings} />
        <ExpenseEntryBox />
      </div>
    </PageWrapper>
  );
}
