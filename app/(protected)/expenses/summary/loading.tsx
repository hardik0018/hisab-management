import { Skeleton } from "@/components/ui/skeleton";
import AppShell from "@/components/AppShell";

export default function Loading() {
  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
        <div className="space-y-3 pt-4">
          <Skeleton className="h-6 w-32 rounded-md mb-4" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card-surface p-4 flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-1/3 rounded-md" />
                <Skeleton className="h-3 w-1/4 rounded-md" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
