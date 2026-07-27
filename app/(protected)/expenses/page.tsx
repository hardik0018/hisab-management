export const dynamic = "force-dynamic";

import React from "react";
import PageWrapper from "@/components/PageWrapper";
import ExpenseTopTabs from "@/components/expense/ExpenseTopTabs";
import ExpenseEntryBox from "@/components/expense/ExpenseEntryBox";
import BackupReminder from "@/components/settings/BackupReminder";
import {
  getSettings,
  getCollaborationData,
  getDashboardStats,
  getMonthlySummary,
} from "@/lib/data-fetching";

export default async function ExpensesPage() {
  const [settings, collabData, stats, summary] = await Promise.all([
    getSettings(),
    getCollaborationData(),
    getDashboardStats(),
    getMonthlySummary(),
  ]);
  const collaborators = collabData?.collaborators || [];
  const currentUserId = collabData?.currentUserId;

  return (
    <PageWrapper>
      <ExpenseTopTabs />
      <div className="max-w-7xl mx-auto p-4 space-y-5 pb-32">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-foreground">Add Expenses</h2>
        </div>

        <BackupReminder settings={settings} />
        <ExpenseEntryBox
          largeAmountLimit={settings.largeAmountLimit}
          collaborators={collaborators}
          currentUserId={currentUserId}
        />
      </div>
    </PageWrapper>
  );
}
