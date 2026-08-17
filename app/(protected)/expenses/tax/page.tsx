export const dynamic = 'force-dynamic';

import TaxDashboardClient from '@/components/expense/TaxDashboardClient';
import { getFinancialYearSummary } from '@/lib/data-fetching';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import { currentFy } from '@/lib/tax/india';
import ExpenseNavTabs from '@/components/expense/ExpenseNavTabs';
import AppShell from '@/components/AppShell';

export default async function TaxPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login');
  }

  // Automatically get current Financial Year (e.g. FY 2026-27 for July 2026)
  const fy = currentFy();
  const summary = await getFinancialYearSummary(fy);

  if (!summary) {
    redirect('/expenses');
  }

  return (
    <>
      <ExpenseNavTabs />
      <AppShell>
        <TaxDashboardClient initialSummary={summary} />
      </AppShell>
    </>
  );
}
