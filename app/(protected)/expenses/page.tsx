export const dynamic = "force-dynamic";

import AppShell from "@/components/AppShell";
import ExpenseNavTabs from "@/components/expense/ExpenseNavTabs";
import LiveStatCards from "@/components/expense/LiveStatCards";
import QuickAddBar from "@/components/QuickAddBar";
import BackupReminder from "@/components/settings/BackupReminder";
import TodayExpensesSection from "@/components/expense/TodayExpensesSection";
import {
  getSettings,
  getCollaborationData,
  getMonthlySummary,
} from "@/lib/data-fetching";

export default async function ExpensesPage() {
  const [settings, collabData, summary] = await Promise.all([
    getSettings(),
    getCollaborationData(),
    getMonthlySummary(),
  ]);

  const collaborators = collabData?.collaborators || [];
  const currentUserId = collabData?.currentUserId;

  // Today's spend from summary
  const todayTotal = summary?.todayTotal ?? 0;
  const monthlyExpense = summary?.monthlyTotal ?? 0;
  const monthlyIncome = summary?.monthlyIncome ?? 0;

  return (
    <>
      <ExpenseNavTabs />

      <AppShell className="pt-3">
        <BackupReminder settings={settings} />

        <LiveStatCards
          initialToday={todayTotal}
          initialMonthlyIn={monthlyIncome}
          initialMonthlyOut={monthlyExpense}
        />

        {/* Always-visible instant add bar */}
        <QuickAddBar
          mode="expense"
          largeLimit={settings.largeAmountLimit}
          collaborators={collaborators}
          currentUserId={currentUserId || ""}
        />

        {/* Today's expense list (client component for live refresh) */}
        <TodayExpensesSection
          collaborators={collaborators}
          currentUserId={currentUserId || ""}
        />
      </AppShell>
    </>
  );
}
