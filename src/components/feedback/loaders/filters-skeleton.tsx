import { Skeleton } from "@/components/ui/skeleton";

export function FiltersSkeleton() {
  return (
    <div className="mb-4 grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-2 lg:col-span-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-9 w-full" />
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}
