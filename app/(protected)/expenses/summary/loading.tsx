import { Skeleton } from "@/components/ui/skeleton";
import PageWrapper from "@/components/PageWrapper";
import ExpenseTopTabs from "@/components/expense/ExpenseTopTabs";

export default function SummaryLoading() {
  return (
    <PageWrapper>
      <ExpenseTopTabs />
      <div className="max-w-7xl mx-auto p-4 space-y-5 pb-32">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>

        {/* Carousel / Month Picker */}
        <div className="bg-card border border-border rounded-3xl p-4 flex items-center justify-between shadow-sm">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex flex-col items-center gap-1">
             <Skeleton className="h-3 w-20 rounded-md" />
             <Skeleton className="h-5 w-32 rounded-md" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>

        {/* Totals Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
           {[1, 2, 3, 4].map((i) => (
             <div key={i} className="bg-card border border-border rounded-3xl p-5 flex flex-col gap-2 shadow-sm">
               <Skeleton className="h-3 w-20 rounded-md" />
               <Skeleton className="h-6 w-32 rounded-md" />
               <Skeleton className="h-3 w-24 rounded-md mt-1" />
             </div>
           ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
           {[1, 2].map(i => (
             <div key={i} className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-sm h-[300px]">
                <div className="flex justify-between items-center">
                   <Skeleton className="h-4 w-32 rounded-md" />
                   <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="h-[200px] w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
             </div>
           ))}
        </div>
      </div>
    </PageWrapper>
  );
}
