import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsLoading() {
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
        <div className="space-y-2">
          <Skeleton className="h-8 w-40 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Categories editor column skeleton */}
          <Card className="md:col-span-2 border-none shadow-md rounded-[2rem] bg-white p-5">
            <CardContent className="p-0 space-y-4">
              <Skeleton className="h-6 w-32 rounded-md" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 w-20 rounded-xl" />
              </div>
              <div className="space-y-2 pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-6 w-6 rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Backup/Export settings column skeleton */}
          <div className="space-y-6">
            <Card className="border-none shadow-md rounded-[2rem] bg-white p-5">
              <CardContent className="p-0 space-y-3">
                <Skeleton className="h-6 w-36 rounded-md" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
