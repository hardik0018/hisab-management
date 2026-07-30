import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import { Card } from "@/components/ui/card";

export default function ProfileLoading() {
  return (
    <PageWrapper>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto pb-32">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-none shadow-sm rounded-3xl p-6 border border-slate-100 space-y-6">
             <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                   <Skeleton className="h-6 w-32 rounded-md" />
                   <Skeleton className="h-4 w-48 rounded-md" />
                </div>
             </div>
             <Skeleton className="h-10 w-full rounded-xl" />
          </Card>
          
          <Card className="border-none shadow-sm rounded-3xl p-6 border border-slate-100 space-y-6">
             <div className="space-y-2 mb-6">
                 <Skeleton className="h-6 w-40 rounded-md" />
                 <Skeleton className="h-4 w-64 rounded-md" />
             </div>
             <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                           <Skeleton className="h-4 w-24 rounded-md" />
                           <Skeleton className="h-3 w-32 rounded-md" />
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
