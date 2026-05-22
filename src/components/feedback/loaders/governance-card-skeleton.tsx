import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function GovernanceCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full max-w-xs" />
        ))}
      </CardContent>
    </Card>
  );
}
