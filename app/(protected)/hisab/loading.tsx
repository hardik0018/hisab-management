
import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent } from "@/components/ui/card";

export default function HisabLoading() {
  return (
    <PageWrapper>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto pb-32">
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <Skeleton className="h-10 w-48 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <Skeleton className="h-12 w-32 rounded-2xl" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-none shadow-sm hover:shadow-lg rounded-[2rem] bg-white p-4 sm:p-6 relative overflow-hidden h-full border-2 border-slate-50 transition-all">
                <div className="flex items-center gap-4 sm:gap-6">
                  <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-[1.25rem] sm:rounded-[1.5rem]" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6 flex-1 h-full overflow-hidden flex flex-col min-h-0">
          <div className="relative group shrink-0">
            <Skeleton className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <Skeleton className="h-4 w-32 rounded-md ml-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8 px-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white border-2 border-transparent">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Skeleton className="w-12 h-12 rounded-2xl" />
                      <div className="min-w-0 space-y-1.5 flex-1">
                        <Skeleton className="h-5 w-32" />
                        <div className="flex items-center gap-1.5">
                          <Skeleton className="h-3 w-3 rounded-full" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1.5">
                      <Skeleton className="h-6 w-20 ml-auto" />
                      <Skeleton className="h-3 w-16 ml-auto" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
