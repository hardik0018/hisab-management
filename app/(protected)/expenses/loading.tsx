import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";

export default function ExpensesLoading() {
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

      <div className="max-w-7xl mx-auto p-4 space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>

        {/* Backup reminder skeleton */}
        <Card className="border-none shadow-md rounded-[1.5rem] bg-amber-50/50 p-4 border border-amber-100/50">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-4 w-60 rounded-md" />
          </div>
        </Card>

        {/* Expense entry box skeleton */}
        <Card className="border-none shadow-lg rounded-[2rem] bg-white p-5">
          <CardContent className="space-y-6 p-0">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-48 rounded-md" />
              <Skeleton className="h-12 w-28 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
