"use client";

import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import {
  EmptyState,
  FactorTableSkeleton,
  FiltersSkeleton,
  QueryErrorState,
} from "@/components/feedback";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FactorRegistryTable } from "@/modules/factors/components/factor-registry-table";
import { LookupSelect } from "@/modules/lookups/components/lookup-select";
import { listFactors } from "@/services/factor.service";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { useWorkspaceLookupSources } from "@/renderer/hooks/use-workspace-lookup-sources";
import { useFactorRegistryLabels } from "@/modules/factors/hooks/use-factor-registry-labels";
import {
  buildFactorListColumns,
  listRegistryFilterFieldIds,
} from "@/modules/factors/utils/factor-workspace-values";

export default function FactorsPage() {
  const workspaceSlug = WORKSPACE_SLUGS.FACTOR_REGISTRY;
  const queryClient = useQueryClient();
  usePrefetchWorkspace(workspaceSlug);
  const { sources, definition, isLoading: workspaceLoading } =
    useWorkspaceLookupSources(workspaceSlug);
  const { labelsByFieldId } = useFactorRegistryLabels(sources);

  const columns = useMemo(
    () => buildFactorListColumns(definition),
    [definition],
  );

  const filterFields = useMemo(() => {
    const fieldIds = listRegistryFilterFieldIds(definition);
    return fieldIds
      .map((fieldId) => {
        const collectionId = sources[fieldId];
        if (!collectionId) {
          return null;
        }
        return {
          fieldId,
          collectionId,
          label: definition?.fields?.[fieldId]?.label ?? fieldId,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);
  }, [definition, sources]);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const queryKey = useMemo(
    () => [
      "factors",
      {
        page,
        search: debouncedSearch,
        ...Object.fromEntries(
          filterFields.map((f) => [f.fieldId, filters[f.fieldId] ?? ""]),
        ),
      },
    ],
    [page, debouncedSearch, filterFields, filters],
  );

  const { data, isLoading, isFetching, error, refetch, isRefetching } =
    useQuery({
      queryKey,
      queryFn: async () => {
        const params: Record<string, string | number | undefined> = {
          page,
          limit: 10,
          search: debouncedSearch.trim() || undefined,
        };
        for (const field of filterFields) {
          const value = filters[field.fieldId];
          if (value) {
            params[field.fieldId] = value;
          }
        }
        const response = await listFactors(params);
        return response.data;
      },
      staleTime: 60_000,
      placeholderData: (previous) => previous,
    });

  const showInitialSkeleton = workspaceLoading || (isLoading && !data);
  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    filterFields.some((f) => Boolean(filters[f.fieldId]));

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Factor Registry</h1>
          <p className="text-sm text-muted-foreground">
            Layout, fields, filters, and table columns come from the factor
            workspace definition.
          </p>
        </div>
        <Link
          href="/factors/new"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          Create factor
        </Link>
      </div>

      {showInitialSkeleton ? (
        <FiltersSkeleton />
      ) : (
        <div className="mb-4 grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1 lg:col-span-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search factors…"
              value={searchInput}
              onChange={(e) => {
                setPage(1);
                setSearchInput(e.target.value);
              }}
            />
          </div>
          {filterFields.map((field) => (
            <LookupSelect
              key={field.fieldId}
              typeCode={field.collectionId}
              label={field.label}
              value={filters[field.fieldId] ?? ""}
              onChange={(value) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, [field.fieldId]: value }));
              }}
            />
          ))}
        </div>
      )}

      {error ? (
        <QueryErrorState
          error={error}
          context={{ resource: "factors" }}
          onRetry={() => {
            void queryClient.invalidateQueries({ queryKey: ["factors"] });
            void refetch();
          }}
          isRetrying={isRefetching}
        />
      ) : null}

      {showInitialSkeleton ? <FactorTableSkeleton /> : null}

      {data && !error ? (
        <>
          {data.items.length === 0 ? (
            <EmptyState
              title="No factors found"
              description={
                hasActiveFilters
                  ? "Try adjusting your search or filters."
                  : "Create your first global scientific factor."
              }
              action={
                <Link
                  href="/factors/new"
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  Create factor
                </Link>
              }
            />
          ) : (
            <div
              className={cn(
                isFetching && !isLoading && "opacity-60 transition-opacity",
              )}
            >
              <FactorRegistryTable
                items={data.items}
                columns={columns}
                labelsByFieldId={labelsByFieldId}
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
