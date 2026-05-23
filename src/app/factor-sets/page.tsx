"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { AppShell } from "@/components/layout/app-shell";
import {
  EmptyState,
  FactorTableSkeleton,
  QueryErrorState,
} from "@/components/feedback";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FactorSetTable } from "@/modules/factor-sets/components/factor-set-table";
import { LIFECYCLE_STATUS } from "@/config/lifecycle";
import { listFactorSets } from "@/services/factor-set.service";

type StatusFilter = typeof LIFECYCLE_STATUS.ACTIVE | typeof LIFECYCLE_STATUS.ARCHIVED | "all";

export default function FactorSetsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    LIFECYCLE_STATUS.ACTIVE,
  );
  const debouncedSearch = useDebouncedValue(searchInput);

  const queryKey = useMemo(
    () => [
      "factor-sets",
      { page, search: debouncedSearch, status: statusFilter },
    ],
    [page, debouncedSearch, statusFilter],
  );

  const { data, isLoading, isFetching, error, refetch, isRefetching } =
    useQuery({
      queryKey,
      queryFn: async () => {
        const response = await listFactorSets({
          page,
          limit: 20,
          search: debouncedSearch.trim() || undefined,
          statusCode:
            statusFilter === "all" ? undefined : statusFilter,
          includeArchived:
            statusFilter === "all" ||
            statusFilter === LIFECYCLE_STATUS.ARCHIVED,
        });
        return response.data;
      },
      staleTime: 60_000,
      placeholderData: (previous) => previous,
    });

  const showSkeleton = isLoading && !data;

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Factor sets</h1>
          <p className="text-sm text-muted-foreground">
            Reusable groupings of global registry factors (e.g. Demographics,
            Renal).
          </p>
        </div>
        <Link
          href="/factor-sets/new"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          New factor set
        </Link>
      </div>

      <div className="mb-4 rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="max-w-md flex-1 space-y-1">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search factor sets…"
              value={searchInput}
              onChange={(e) => {
                setPage(1);
                setSearchInput(e.target.value);
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="flex h-9 w-full min-w-[140px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value as StatusFilter);
              }}
            >
              <option value={LIFECYCLE_STATUS.ACTIVE}>Active</option>
              <option value={LIFECYCLE_STATUS.ARCHIVED}>Archived</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <QueryErrorState
          error={error}
          context={{ resource: "factor sets" }}
          onRetry={() => {
            void queryClient.invalidateQueries({ queryKey: ["factor-sets"] });
            void refetch();
          }}
          isRetrying={isRefetching}
        />
      ) : null}

      {showSkeleton ? <FactorTableSkeleton /> : null}

      {data && !error ? (
        <>
          {data.items.length === 0 ? (
            <EmptyState
              title="No factor sets found"
              description={
                debouncedSearch || statusFilter !== LIFECYCLE_STATUS.ACTIVE
                  ? "Try different filters or search terms."
                  : "Create a factor set to group registry factors."
              }
              action={
                <Link
                  href="/factor-sets/new"
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  New factor set
                </Link>
              }
            />
          ) : (
            <div
              className={cn(
                isFetching && !isLoading && "opacity-60 transition-opacity",
              )}
            >
              <FactorSetTable items={data.items} />
            </div>
          )}
          {data.items.length > 0 ? (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages} (
                {data.pagination.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    page >= data.pagination.totalPages || isFetching
                  }
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </AppShell>
  );
}
