export const dynamic = 'force-dynamic';

import { getMonthlySummary, getTodayKolkata } from '@/lib/data-fetching';
import SummaryClient from './SummaryClient';
import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/lib/auth';
import ExpenseNavTabs from '@/components/expense/ExpenseNavTabs';

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
      <ExpenseNavTabs />
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
        initialInvestmentsSummary={summary.investmentsSummary}
        searchParams={params}
      />
    </>
  );
}
