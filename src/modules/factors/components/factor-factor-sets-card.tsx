"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatLifecycleStatus } from "@/config/lifecycle";
import { useFactorFactorSets } from "@/modules/factors/hooks/use-factor-factor-sets";

type FactorFactorSetsCardProps = {
  factorId: string;
};

export function FactorFactorSetsCard({ factorId }: FactorFactorSetsCardProps) {
  const { data, isLoading, isError } = useFactorFactorSets(factorId);

  return (
    <Card className="rounded-[24px] border-white/[0.06] bg-[#111114] text-[#f4f4f5] shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-lg font-semibold">Used in factor sets</CardTitle>
        <Link
          href="/factor-sets"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "border-white/10 bg-transparent text-[#f4f4f5] hover:bg-white/5",
          )}
        >
          All factor sets
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full bg-white/10" />
            <Skeleton className="h-9 w-full bg-white/10" />
          </div>
        ) : null}

        {isError ? (
          <p className="text-sm text-[#f4f4f5]/60">
            Could not load factor set references.
          </p>
        ) : null}

        {!isLoading && !isError && data?.length === 0 ? (
          <p className="text-sm text-[#f4f4f5]/60">
            This factor is not included in any factor set. Add it from a set&apos;s
            edit page.
          </p>
        ) : null}

        {!isLoading && !isError && data && data.length > 0 ? (
          <ul className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.06]">
            {data.map((set) => (
              <li key={set.id}>
                <Link
                  href={`/factor-sets/${set.id}/edit`}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                >
                  <span className="min-w-0 font-medium">{set.displayName}</span>
                  <span className="shrink-0 text-xs text-[#f4f4f5]/50">
                    {formatLifecycleStatus(set.statusCode)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
