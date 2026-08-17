import AppShell from '@/components/AppShell';
import ExpenseNavTabs from '@/components/expense/ExpenseNavTabs';

export default function TripsLoading() {
  return (
    <>
      <ExpenseNavTabs />
      <AppShell className="pt-3">
        <div className="space-y-4 animate-pulse">
          {/* Header Skeleton */}
          <div className="h-14 bg-muted/60 rounded-2xl w-full" />
          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-muted/60 rounded-2xl" />
            <div className="h-24 bg-muted/60 rounded-2xl" />
          </div>
          {/* Card Skeletons */}
          <div className="h-36 bg-muted/60 rounded-2xl w-full" />
          <div className="h-36 bg-muted/60 rounded-2xl w-full" />
        </div>
      </AppShell>
    </>
  );
}
