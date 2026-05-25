"use client";

import Link from "next/link";
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
  QueryErrorState,
} from "@/components/feedback";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ENTITY_TYPE } from "@/config/platform";
import { useListPagination } from "@/hooks/use-list-pagination";
import { CategoryTable } from "@/modules/platform/components/category-table";
import { listEntityRecords } from "@/services/entity-record.service";
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { page, setPage, searchInput, debouncedSearch, onSearchChange, queryParams } =
    useListPagination();

  const queryKey = ["categories", queryParams] as const;

  const { data, isLoading, isFetching, error, refetch, isRefetching } =
    useQuery({
      queryKey,
      queryFn: async () => {
        const response = await listEntityRecords(ENTITY_TYPE.CATEGORY, queryParams);
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
        { label: "Categories" },
      ]}
      contextLine="Therapeutic areas and program groupings"
    >
      <PageHeader
        title="Categories"
        description="Top-level registry grouping for drugs and models."
        actions={
          <Link
            href="/categories/new"
            className={cn(buttonVariants({ variant: "default" }), platform.primaryButton)}
          >
            New category
          </Link>
        }
      />

      <ContentCard className="mb-4">
        <FilterBar>
          <FilterField id="category-search" label="Search" className="max-w-md flex-1">
            <Input
              id="category-search"
              placeholder="Search categories…"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              className={platform.input}
            />
          </FilterField>
        </FilterBar>
      </ContentCard>

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
        <RegistryListCard
          total={data.pagination.total}
          isFetching={isFetching}
          isLoading={isLoading}
          empty={
            data.items.length === 0 ? (
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
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      platform.primaryButton,
                    )}
                  >
                    New category
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
            <CategoryTable items={data.items} variant="platform" />
          ) : null}
        </RegistryListCard>
      ) : null}
    </RegistryListShell>
  );
}
