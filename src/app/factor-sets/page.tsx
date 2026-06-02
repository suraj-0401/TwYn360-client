"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { PageHeader } from "@/components/layout/page-header";
import { ContentCard } from "@/components/layout/content-card";
import { FilterBar } from "@/components/layout/filter-bar";
import { FilterField } from "@/components/layout/filter-field";
import { RegistryListShell } from "@/components/layout/registry-list-shell";
import { RegistryListCard } from "@/components/layout/registry-list-card";
import { RegistryStatusSelect } from "@/components/layout/registry-status-select";
import type { RegistryStatusFilter } from "@/components/layout/registry-status-select";
import {
  EmptyState,
  FactorTableSkeleton,
  QueryErrorState,
} from "@/components/feedback";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FactorSetTable } from "@/modules/factor-sets/components/factor-set-table";
import { LIFECYCLE_STATUS } from "@/config/lifecycle";
import { listFactorSets } from "@/services/factor-set.service";
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";

export default function FactorSetsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<RegistryStatusFilter>(
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
    <RegistryListShell
      breadcrumbs={[
        { label: "Registry", href: "/factors" },
        { label: "Factor sets" },
      ]}
      contextLine="Reusable groupings of global registry factors"
    >
      <PageHeader
        title="Factor sets"
        description="Demographics, Renal, Metabolic — attach to drug models in order."
        actions={
          <Link
            href="/factor-sets/new"
            className={cn(buttonVariants({ variant: "default" }), platform.primaryButton)}
          >
            New factor set
          </Link>
        }
      />

      <ContentCard className="mb-4">
        <FilterBar>
          <FilterField id="factor-set-search" label="Search" className="max-w-md flex-1">
            <Input
              id="factor-set-search"
              placeholder="Search factor sets…"
              value={searchInput}
              onChange={(e) => {
                setPage(1);
                setSearchInput(e.target.value);
              }}
              className={platform.input}
            />
          </FilterField>
          <RegistryStatusSelect
            id="factor-set-status"
            value={statusFilter}
            onChange={(value) => {
              setPage(1);
              setStatusFilter(value);
            }}
          />
        </FilterBar>
      </ContentCard>

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
        <div className="flex min-h-0 flex-1 flex-col">
        <RegistryListCard
          className="min-h-0 flex-1"
          total={data.pagination.total}
          isFetching={isFetching}
          isLoading={isLoading}
          empty={
            data.items.length === 0 ? (
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
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      platform.primaryButton,
                    )}
                  >
                    New factor set
                  </Link>
                }
              />
            ) : undefined
          }
          pagination={
            data.items.length > 0
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
            <FactorSetTable items={data.items} variant="platform" />
          ) : null}
        </RegistryListCard>
        </div>
      ) : null}
    </RegistryListShell>
  );
}
