export const dynamic = "force-dynamic";

import AppShell from "@/components/AppShell";
import SegmentedTabs from "@/components/SegmentedTabs";
import LiveStatCards from "@/components/expense/LiveStatCards";
import QuickAddBar from "@/components/QuickAddBar";
import BackupReminder from "@/components/settings/BackupReminder";
import TodayExpensesSection from "@/components/expense/TodayExpensesSection";
import {
  getSettings,
  getCollaborationData,
  getMonthlySummary,
} from "@/lib/data-fetching";

const EXPENSE_TABS = [
  { label: "Today", href: "/expenses" },
  { label: "History", href: "/expenses/history" },
  { label: "Auto", href: "/expenses/recurring" },
  { label: "Report", href: "/expenses/summary" },
  { label: "Tax", href: "/expenses/tax" },
];

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
      <SegmentedTabs tabs={EXPENSE_TABS} />

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
