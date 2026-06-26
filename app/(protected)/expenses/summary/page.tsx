export const dynamic = 'force-dynamic';

import { getMonthlySummary, getTodayKolkata } from '@/lib/data-fetching';
import SummaryClient from './SummaryClient';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';

interface PageProps {
  searchParams: Promise<{
    month?: string;
    search?: string;
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

  const summary = await getMonthlySummary(activeMonth, params.search);

  if (!summary) {
    redirect('/expenses');
  }

  return (
    <SummaryClient
      initialMonth={summary.month}
      initialMonthlyTotal={summary.monthlyTotal}
      initialMonthlyIncome={summary.monthlyIncome}
      initialFilteredTotal={summary.filteredTotal}
      initialDailyTotals={summary.dailyTotals}
      initialTodayTotal={summary.todayTotal}
      searchParams={params}
    />
  );
}
