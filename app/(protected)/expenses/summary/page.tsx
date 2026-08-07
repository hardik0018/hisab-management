export const dynamic = 'force-dynamic';

import { getMonthlySummary, getTodayKolkata } from '@/lib/data-fetching';
import SummaryClient from './SummaryClient';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import SegmentedTabs from '@/components/SegmentedTabs';

const EXPENSE_TABS = [
  { label: 'Today', href: '/expenses' },
  { label: 'History', href: '/expenses/history' },
  { label: 'Auto', href: '/expenses/recurring' },
  { label: 'Report', href: '/expenses/summary' },
  { label: 'Tax', href: '/expenses/tax' },
];

interface PageProps {
  searchParams: Promise<{
    month?: string;
    search?: string;
    category?: string;
  }>;
}

export default async function SummaryPage({ searchParams }: PageProps) {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect('/login');
  }

  const params = await searchParams;
  let activeMonth = params.month || '';
  if (!activeMonth) {
    const todayStr = getTodayKolkata();
    activeMonth = todayStr.substring(0, 7);
  }

  const summary = await getMonthlySummary(activeMonth, params.search, params.category);

  if (!summary) {
    redirect('/expenses');
  }

  return (
    <>
      <SegmentedTabs tabs={EXPENSE_TABS} />
      <SummaryClient
        initialMonth={summary.month}
        initialMonthlyTotal={summary.monthlyTotal}
        initialMonthlyIncome={summary.monthlyIncome}
        initialFilteredTotal={summary.filteredTotal}
        initialDailyTotals={summary.dailyTotals}
        initialTodayTotal={summary.todayTotal}
        initialMemberBalances={summary.memberBalances}
        initialCategoryBreakdown={summary.categoryBreakdown}
        initialCategoryTransactions={summary.categoryTransactions}
        initialTopExpenses={summary.topExpenses}
        searchParams={params}
      />
    </>
  );
}
