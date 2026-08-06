export const dynamic = "force-dynamic";

import AppShell from "@/components/AppShell";
import SegmentedTabs from "@/components/SegmentedTabs";
import StatCard from "@/components/StatCard";
import QuickAddBar from "@/components/QuickAddBar";
import BackupReminder from "@/components/settings/BackupReminder";
import TodayExpensesSection from "@/components/expense/TodayExpensesSection";
import {
  getSettings,
  getCollaborationData,
  getDashboardStats,
  getMonthlySummary,
} from "@/lib/data-fetching";

const EXPENSE_TABS = [
  { label: "Today", href: "/expenses" },
  { label: "History", href: "/expenses/history" },
  { label: "Auto", href: "/expenses/recurring" },
  { label: "Report", href: "/expenses/summary" },
  { label: "Tax", href: "/expenses/tax" },
  { label: "Settings", href: "/expenses/settings" },
];

export default async function ExpensesPage() {
  const [settings, collabData, stats, summary] = await Promise.all([
    getSettings(),
    getCollaborationData(),
    getDashboardStats(),
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

        {/* Hero card — today's spend */}
        <StatCard
          variant="hero"
          label="Spent today"
          amount={todayTotal}
          caption="Tap a chip below or type to add"
        />

        {/* Money in / out row */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            variant="in"
            label="Money in"
            amount={monthlyIncome}
            caption="This month"
          />
          <StatCard
            variant="out"
            label="Money out"
            amount={monthlyExpense}
            caption="This month"
          />
        </div>

        {/* Always-visible instant add bar */}
        <QuickAddBar
          mode="expense"
          largeLimit={settings.largeAmountLimit}
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
