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
import { CategoryTable } from "@/modules/platform/components/category-table";
import { listEntityRecords } from "@/services/entity-record.service";

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);

  const queryKey = useMemo(
    () => ["categories", { page, search: debouncedSearch }],
    [page, debouncedSearch],
  );

  const { data, isLoading, isFetching, error, refetch, isRefetching } =
    useQuery({
      queryKey,
      queryFn: async () => {
        const response = await listEntityRecords(ENTITY_TYPE.CATEGORY, {
          page,
          limit: 20,
          search: debouncedSearch.trim() || undefined,
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
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Therapeutic areas and program groupings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {env.NEXT_PUBLIC_ADMIN_API_KEY ? (
            <Link
              href="/categories/form"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Customize form
            </Link>
          ) : null}
          <Link
            href="/categories/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            New category
          </Link>
        </div>
      </div>

      <div className="mb-4 rounded-lg border bg-card p-4">
        <div className="max-w-md space-y-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search categories…"
            value={searchInput}
            onChange={(e) => {
              setPage(1);
              setSearchInput(e.target.value);
            }}
          />
        </div>
      </div>

      {error ? (
        <QueryErrorState
          error={error}
          context={{ resource: "categories" }}
          onRetry={() => {
            void queryClient.invalidateQueries({ queryKey: ["categories"] });
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
              title="No categories found"
              description={
                debouncedSearch
                  ? "Try a different search term."
                  : "Create your first category."
              }
              action={
                <Link
                  href="/categories/new"
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  New category
                </Link>
              }
            />
          ) : (
            <div
              className={cn(
                isFetching && !isLoading && "opacity-60 transition-opacity",
              )}
            >
              <CategoryTable items={data.items} />
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
