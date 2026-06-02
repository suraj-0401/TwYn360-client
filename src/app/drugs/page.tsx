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
import {
  EmptyState,
  FactorTableSkeleton,
  QueryErrorState,
} from "@/components/feedback";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ENTITY_TYPE } from "@/config/platform";
import { DrugTable } from "@/modules/platform/components/drug-table";
import { CategoryRecordSelect } from "@/modules/platform/components/category-record-select";
import { useCategoryLabelMap } from "@/modules/platform/hooks/use-category-options";
import { listEntityRecords } from "@/services/entity-record.service";
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";

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
    <RegistryListShell
      breadcrumbs={[
        { label: "Registry", href: "/factors" },
        { label: "Drugs" },
      ]}
      contextLine="Drug programs scoped under therapeutic categories"
    >
      <PageHeader
        title="Drugs"
        description="Each drug can own multiple scientific models and factor set graphs."
        actions={
          <Link
            href="/drugs/new"
            className={cn(buttonVariants({ variant: "default" }), platform.primaryButton)}
          >
            New drug
          </Link>
        }
      />

      <ContentCard className="mb-4">
        <FilterBar>
          <FilterField id="drug-search" label="Search" className="max-w-md flex-1">
            <Input
              id="drug-search"
              placeholder="Search drugs…"
              value={searchInput}
              onChange={(e) => {
                setPage(1);
                setSearchInput(e.target.value);
              }}
              className={platform.input}
            />
          </FilterField>
          <CategoryRecordSelect
            label="Category"
            variant="platform"
            value={categoryFilter}
            onChange={(value) => {
              setPage(1);
              setCategoryFilter(value);
            }}
          />
        </FilterBar>
      </ContentCard>

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
        <div className="flex min-h-0 flex-1 flex-col">
        <RegistryListCard
          className="min-h-0 flex-1"
          total={data.pagination.total}
          isFetching={isFetching}
          isLoading={isLoading}
          empty={
            data.items.length === 0 ? (
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
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      platform.primaryButton,
                    )}
                  >
                    New drug
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
            <DrugTable
              items={data.items}
              categoryLabelById={categoryLabelById}
              variant="platform"
            />
          ) : null}
        </RegistryListCard>
        </div>
      ) : null}
    </RegistryListShell>
  );
}
