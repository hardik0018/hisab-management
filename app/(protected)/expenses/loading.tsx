
import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ExpensesLoading() {
  return (
    <PageWrapper>
      <div className="p-4 space-y-8 max-w-7xl mx-auto pb-32">
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <Skeleton className="h-10 w-48 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <Skeleton className="h-12 w-32 rounded-2xl" />
          </div>

          <Card className="border-none shadow-xl bg-slate-950 text-white rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden relative">
            <CardContent className="p-5 sm:p-10 relative z-10">
              <div className="flex items-center gap-4 sm:gap-8">
                <Skeleton className="w-16 h-16 sm:w-28 sm:h-28 rounded-2xl sm:rounded-[2rem] bg-white/5" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-24 bg-white/10" />
                  <div className="flex items-baseline gap-1.5 sm:gap-3">
                    <Skeleton className="h-10 sm:h-16 w-48 bg-white/20" />
                    <Skeleton className="h-4 w-20 bg-white/10" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full md:w-[200px] rounded-2xl" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-none shadow-lg rounded-2xl bg-white overflow-hidden p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="text-right flex-shrink-0 space-y-1">
                    <Skeleton className="h-6 w-20 ml-auto" />
                    <Skeleton className="h-3 w-12 ml-auto" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
