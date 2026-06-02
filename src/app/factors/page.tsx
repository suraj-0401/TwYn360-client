"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { ContentCard } from "@/components/layout/content-card";
import { FilterBar } from "@/components/layout/filter-bar";
import { FilterField } from "@/components/layout/filter-field";
import { RegistryListShell } from "@/components/layout/registry-list-shell";
import { RegistryListCard } from "@/components/layout/registry-list-card";
import {
  EmptyState,
  FactorTableSkeleton,
  FiltersSkeleton,
  QueryErrorState,
} from "@/components/feedback";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";

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
          limit: 20,
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
    <RegistryListShell
      breadcrumbs={[
        { label: "Registry" },
        { label: "Factors" },
      ]}
      contextLine="Global scientific factors · workspace-driven columns"
    >
      <PageHeader
        title="Factor registry"
        description="Layout, fields, filters, and table columns come from the factor workspace definition."
        actions={
          <Link
            href="/factors/new"
            className={cn(buttonVariants({ variant: "default" }), platform.primaryButton)}
          >
            Create factor
          </Link>
        }
      />

      {showInitialSkeleton ? (
        <FiltersSkeleton />
      ) : (
        <ContentCard className="mb-4">
          <FilterBar>
            <FilterField id="factor-search" label="Search" className="max-w-md flex-1 lg:col-span-2">
              <Input
                id="factor-search"
                placeholder="Search factors…"
                value={searchInput}
                onChange={(e) => {
                  setPage(1);
                  setSearchInput(e.target.value);
                }}
                className={platform.input}
              />
            </FilterField>
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
          </FilterBar>
        </ContentCard>
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
        <div className="flex min-h-0 flex-1 flex-col">
        <RegistryListCard
          className="min-h-0 flex-1"
          total={data.pagination.total}
          isFetching={isFetching}
          isLoading={isLoading}
          empty={
            data.items.length === 0 ? (
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
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      platform.primaryButton,
                    )}
                  >
                    Create factor
                  </Link>
                }
              />
            ) : undefined
          }
          pagination={
            data.pagination.total > 0
              ? {
                  meta: data.pagination,
                  page,
                  onPageChange: setPage,
                  isFetching,
                }
              : undefined
          }
        >
          {data.items.length > 0 ? (
            <FactorRegistryTable
              items={data.items}
              columns={columns}
              labelsByFieldId={labelsByFieldId}
              variant="platform"
            />
          ) : null}
        </RegistryListCard>
        </div>
      ) : null}
    </RegistryListShell>
  );
}
