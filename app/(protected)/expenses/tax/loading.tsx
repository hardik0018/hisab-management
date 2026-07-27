import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import ExpenseTopTabs from "@/components/expense/ExpenseTopTabs";
import { Card, CardContent } from "@/components/ui/card";

export default function TaxLoading() {
  return (
    <PageWrapper>
      <ExpenseTopTabs />
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>

        <Card className="border border-border/60 shadow-md rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted/40 p-4 rounded-2xl space-y-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-7 w-32 rounded-md" />
              </div>
            ))}
          </div>
        </Card>

        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    </PageWrapper>
  );
}
