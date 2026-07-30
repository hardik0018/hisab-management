import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import { Card } from "@/components/ui/card";

export default function HisabLoading() {
  return (
    <PageWrapper>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto pb-32">
        <div className="space-y-6">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
             <div className="space-y-2">
                <Skeleton className="h-10 w-48 rounded-md" />
                <Skeleton className="h-4 w-72 rounded-md" />
             </div>
             <Skeleton className="h-12 w-full sm:w-32 rounded-2xl" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-none shadow-sm rounded-3xl p-5 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <Skeleton className="h-4 w-28 rounded-md" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-md mb-1" />
                  <Skeleton className="h-3 w-32 rounded-md" />
                </Card>
              ))}
           </div>
        </div>

        <div className="space-y-6">
            <Skeleton className="h-14 w-full rounded-2xl" />
            
            <div className="space-y-4">
              <Skeleton className="h-4 w-32 rounded-md mb-2" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="border-none shadow-sm rounded-[2rem] overflow-hidden p-5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-2xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-24 rounded-md" />
                          <Skeleton className="h-3 w-20 rounded-md" />
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <Skeleton className="h-6 w-16 rounded-md ml-auto" />
                        <Skeleton className="h-4 w-12 rounded-full ml-auto" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
        </div>
      </div>
    </PageWrapper>
  );
}
