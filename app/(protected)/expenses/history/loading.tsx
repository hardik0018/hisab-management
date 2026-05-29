import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";

export default function HistoryLoading() {
  return (
    <PageWrapper>
      {/* Tab bar skeleton matching ExpenseTopTabs */}
      <div className="flex border-b border-border bg-card sticky top-0 z-50 justify-center w-full">
        <div className="flex w-full max-w-md justify-between px-4 h-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 h-full border-b-2 border-transparent">
              <Skeleton className="w-3.5 h-3.5 rounded-full" />
              <Skeleton className="h-3 w-10 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40 rounded-md" />
            <Skeleton className="h-4 w-60 rounded-md" />
          </div>
        </div>

        {/* Filter and Search Bar skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-12 w-32 rounded-xl" />
            <Skeleton className="h-12 w-32 rounded-xl" />
          </div>
        </div>

        {/* Expenses List Skeletons */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-none shadow-sm rounded-2xl bg-white p-4">
              <CardContent className="p-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="min-w-0 space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3 rounded-md" />
                    <Skeleton className="h-3 w-1/5 rounded-md" />
                  </div>
                </div>
                <div className="text-right space-y-2 shrink-0">
                  <Skeleton className="h-5 w-16 rounded-md ml-auto" />
                  <Skeleton className="h-3 w-12 rounded-md ml-auto" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
