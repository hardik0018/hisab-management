import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import { Card } from "@/components/ui/card";

export default function PasswordsLoading() {
  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Skeleton className="h-8 w-48 rounded-md" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 rounded-2xl border border-border/60 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-36 rounded-md" />
                  <Skeleton className="h-4 w-48 rounded-md" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
