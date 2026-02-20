
import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <PageWrapper>
      <div className="p-4 space-y-8 max-w-7xl mx-auto pb-32">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <Skeleton className="h-12 w-64 rounded-xl" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-48 rounded-md" />
                <div className="flex -space-x-2">
                  <Skeleton className="h-7 w-7 rounded-full border-2 border-white" />
                  <Skeleton className="h-7 w-7 rounded-full border-2 border-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl sm:rounded-[1.5rem]" />
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-none shadow-lg rounded-2xl sm:rounded-[2rem] bg-white overflow-hidden p-3 sm:p-6 ring-1 ring-slate-100 h-full">
              <div className="flex items-center gap-3 sm:gap-5 h-full">
                <Skeleton className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-3xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Skeleton */}
          <Card className="lg:col-span-2 border-none shadow-lg bg-white rounded-2xl sm:rounded-[2.5rem] overflow-hidden">
            <div className="p-4 sm:p-8 border-b border-slate-50 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <CardContent className="p-2 sm:p-8 h-[250px] sm:h-[350px] flex items-end gap-4">
               {[1, 2, 3].map((i) => (
                 <Skeleton key={i} className="w-full rounded-t-lg" style={{ height: `${20 + i * 20}%` }} />
               ))}
            </CardContent>
          </Card>

          {/* Recent Activity Skeleton */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-white">
                <Skeleton className="h-6 w-32" />
              </div>
              <CardContent className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
