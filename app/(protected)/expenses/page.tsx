export const dynamic = 'force-dynamic';

import React from 'react';
import PageWrapper from '@/components/PageWrapper';
import ExpenseTopTabs from '@/components/expense/ExpenseTopTabs';
import ExpenseEntryBox from '@/components/expense/ExpenseEntryBox';
import BackupReminder from '@/components/settings/BackupReminder';
import { getSettings } from '@/lib/data-fetching';

export default async function ExpensesPage() {
  const settings = await getSettings();

  return (
    <PageWrapper>
      <ExpenseTopTabs />
      <div className="max-w-7xl mx-auto p-4 space-y-5">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-foreground">Add Expenses</h2>
          <p className="text-xs text-muted-foreground font-medium">Record daily outflows using bulk plain text entries.</p>
        </div>

        <BackupReminder settings={settings} />
        <ExpenseEntryBox />
      </div>
    </PageWrapper>
  );
}
