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
import { ENTITY_TYPE } from "@/config/platform";
import { env } from "@/config/env";
import { DrugTable } from "@/modules/platform/components/drug-table";
import { CategoryRecordSelect } from "@/modules/platform/components/category-record-select";
import { useCategoryLabelMap } from "@/modules/platform/hooks/use-category-options";
import { listEntityRecords } from "@/services/entity-record.service";

export default function DrugsPage() {
  const queryClient = useQueryClient();
  const { map: categoryLabelById } = useCategoryLabelMap();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [categoryFilter, setCategoryFilter] = useState("");

  const queryKey = useMemo(
    () => [
      "drugs",
      { page, search: debouncedSearch, categoryId: categoryFilter },
    ],
    [page, debouncedSearch, categoryFilter],
  );

  const { data, isLoading, isFetching, error, refetch, isRefetching } =
    useQuery({
      queryKey,
      queryFn: async () => {
        const response = await listEntityRecords(ENTITY_TYPE.DRUG, {
          page,
          limit: 20,
          search: debouncedSearch.trim() || undefined,
          categoryId: categoryFilter || undefined,
        });
        return response.data;
      },
      staleTime: 60_000,
      placeholderData: (previous) => previous,
    });

  const showSkeleton = isLoading && !data;

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Drugs</h1>
          <p className="text-sm text-muted-foreground">
            Drug programs scoped under a category.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {env.NEXT_PUBLIC_ADMIN_API_KEY ? (
            <Link
              href="/drugs/form"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Customize form
            </Link>
          ) : null}
          <Link
            href="/drugs/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            New drug
          </Link>
        </div>
      </div>

      <div className="mb-4 grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search drugs…"
            value={searchInput}
            onChange={(e) => {
              setPage(1);
              setSearchInput(e.target.value);
            }}
          />
        </div>
        <CategoryRecordSelect
          label="Filter by category"
          value={categoryFilter}
          onChange={(value) => {
            setPage(1);
            setCategoryFilter(value);
          }}
        />
      </div>

      {error ? (
        <QueryErrorState
          error={error}
          context={{ resource: "drugs" }}
          onRetry={() => {
            void queryClient.invalidateQueries({ queryKey: ["drugs"] });
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
              title="No drugs found"
              description={
                debouncedSearch || categoryFilter
                  ? "Try adjusting search or filters."
                  : "Create your first drug under a category."
              }
              action={
                <Link
                  href="/drugs/new"
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  New drug
                </Link>
              }
            />
          ) : (
            <div
              className={cn(
                isFetching && !isLoading && "opacity-60 transition-opacity",
              )}
            >
              <DrugTable
                items={data.items}
                categoryLabelById={categoryLabelById}
              />
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
