export const dynamic = 'force-dynamic';

import React from 'react';
import PageWrapper from '@/components/PageWrapper';
import ExpenseTopTabs from '@/components/expense/ExpenseTopTabs';
import TaxDashboardClient from '@/components/expense/TaxDashboardClient';
import { getFinancialYearSummary } from '@/lib/data-fetching';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

export default async function TaxPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login');
  }

  // Automatically get current Financial Year (e.g. FY 2026-27 for July 2026)
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0 is January, 3 is April
  const startYear = month >= 3 ? year : year - 1;
  const currentFy = `${startYear}-${String(startYear + 1).slice(-2)}`;

  const summary = await getFinancialYearSummary(currentFy);

  if (!summary) {
    redirect('/expenses');
  }

  return (
    <PageWrapper>
      <ExpenseTopTabs />
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-foreground font-sans tracking-tight flex items-center gap-2">
            💡 Simple Income Tax Check (This Year)
          </h2>
          <p className="text-xs text-muted-foreground font-medium">
            We automatically check your earnings and spending to tell you in plain words if you owe any tax.
          </p>
        </div>

        <TaxDashboardClient initialSummary={summary} />
      </div>
    </PageWrapper>
  );
}
