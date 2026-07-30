import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import { Card } from "@/components/ui/card";

export default function VaultLoading() {
  return (
    <PageWrapper>
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto pb-32">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-56 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-none shadow-sm rounded-3xl p-6 border border-slate-100">
               <div className="flex flex-col gap-4">
                 <Skeleton className="h-12 w-12 rounded-xl" />
                 <div className="space-y-2">
                    <Skeleton className="h-5 w-32 rounded-md" />
                    <Skeleton className="h-4 w-48 rounded-md" />
                 </div>
               </div>
            </Card>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
