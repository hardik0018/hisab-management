import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import { Card } from "@/components/ui/card";

export default function VaultLoading() {
  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>

        {/* Top summary/nav banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 rounded-2xl border border-border/60 shadow-sm flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
              <Skeleton className="w-10 h-10 rounded-xl" />
            </Card>
          ))}
        </div>

        {/* Content list */}
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 rounded-3xl border border-border/60 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-40 rounded-md" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-60 rounded-md" />
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
              <div className="flex gap-4 pt-2 border-t border-border/40">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-4 w-28 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
