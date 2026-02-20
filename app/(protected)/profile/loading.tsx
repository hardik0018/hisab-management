
import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfileLoading() {
  return (
    <PageWrapper>
      <div className="p-4 space-y-8 max-w-2xl mx-auto pb-32">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>

        <Card className="border-none shadow-2xl bg-slate-950 text-white rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden relative group">
          <CardContent className="p-5 sm:p-8 relative z-10">
            <div className="flex items-center gap-4 sm:gap-8">
              <Skeleton className="h-16 w-16 sm:h-32 sm:w-32 border-2 sm:border-4 border-white/10 ring-4 sm:ring-8 ring-white/5 shadow-2xl rounded-full" />
              <div className="space-y-2 sm:space-y-4 min-w-0 flex-1">
                <Skeleton className="h-6 w-3/4 rounded-md" />
                <div className="flex items-center gap-1.5 flex-1">
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                </div>
                <div className="pt-1.5 sm:pt-4 flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Skeleton className="h-4 w-24 rounded-md px-4 mb-2" />
          <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <Skeleton className="w-14 h-14 rounded-2xl" />
                <div className="text-left space-y-2">
                  <Skeleton className="h-5 w-48 rounded-md" />
                  <Skeleton className="h-3 w-32 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <Skeleton className="h-10 w-10 border-4 border-white rounded-full" />
                  <Skeleton className="h-10 w-10 border-4 border-white rounded-full" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-24 rounded-md px-4 mb-2" />
          <div className="grid grid-cols-1 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="w-full flex items-center justify-between p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center gap-5">
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <div className="text-left space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <Skeleton className="w-full h-20 rounded-[2rem] bg-red-50/50" />
      </div>
    </PageWrapper>
  );
}
