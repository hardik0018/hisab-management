import AppShell from '@/components/AppShell';

export default function TripDetailLoading() {
  return (
    <AppShell className="pt-3 pb-24">
      <div className="space-y-4 animate-pulse">
        {/* Top bar back button skeleton */}
        <div className="h-8 w-24 bg-muted/60 rounded-xl" />

        {/* Hero Banner Skeleton */}
        <div className="h-44 bg-muted/60 rounded-3xl w-full" />

        {/* Live Stat Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="h-20 bg-muted/60 rounded-2xl" />
          <div className="h-20 bg-muted/60 rounded-2xl" />
          <div className="h-20 bg-muted/60 rounded-2xl" />
          <div className="h-20 bg-muted/60 rounded-2xl" />
        </div>

        {/* Tabs Skeleton */}
        <div className="h-10 bg-muted/60 rounded-xl w-full" />

        {/* Expense List Skeleton */}
        <div className="space-y-2">
          <div className="h-16 bg-muted/60 rounded-2xl w-full" />
          <div className="h-16 bg-muted/60 rounded-2xl w-full" />
          <div className="h-16 bg-muted/60 rounded-2xl w-full" />
        </div>
      </div>
    </AppShell>
  );
}
