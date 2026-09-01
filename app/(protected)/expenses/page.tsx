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

      <AppShell variant="wide" className="pt-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Action & Feed Column (Mobile: top; Desktop: left 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
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
          </div>

          {/* Overview & Stats Column (Mobile: stacked below on small screens or above; Desktop: right 5 cols sticky) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-14 order-first lg:order-last">
            <BackupReminder settings={settings} />

            <div className="space-y-3">
              <LiveStatCards
                initialToday={todayTotal}
                initialMonthlyIn={monthlyIncome}
                initialMonthlyOut={monthlyExpense}
              />
            </div>
          </div>
        </div>
      </AppShell>
    </>
  );
}
