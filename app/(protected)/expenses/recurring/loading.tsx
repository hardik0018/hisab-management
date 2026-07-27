import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import ExpenseTopTabs from "@/components/expense/ExpenseTopTabs";
import { Card, CardContent } from "@/components/ui/card";

export default function RecurringLoading() {
  return (
    <PageWrapper>
      <ExpenseTopTabs />
      <div className="max-w-4xl mx-auto p-4 space-y-5">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <Skeleton className="h-7 w-48 rounded-md" />
            <Skeleton className="h-4 w-72 rounded-md" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border border-border/60 shadow-sm rounded-2xl p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-32 rounded-md" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-48 rounded-md" />
                </div>
                <div className="space-y-2 text-right">
                  <Skeleton className="h-6 w-24 rounded-md ml-auto" />
                  <Skeleton className="h-8 w-20 rounded-lg ml-auto" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
