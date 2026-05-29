import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";

export default function SummaryLoading() {
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
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        {/* Overview cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="border-none shadow-md rounded-[1.5rem] bg-white p-5">
              <CardContent className="p-0 flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-6 w-32 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and filters skeleton */}
        <div className="relative">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>

        {/* List group breakdown skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-32 rounded-md" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-none shadow-sm rounded-xl bg-white p-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36 rounded-md" />
                    <Skeleton className="h-3 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
