"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { PlatformShell } from "@/components/layout/platform-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ContentCard } from "@/components/layout/content-card";
import { FilterBar } from "@/components/layout/filter-bar";
import { FilterField } from "@/components/layout/filter-field";
import { ListToolbar } from "@/components/data-table/list-toolbar";
import {
  EmptyState,
  FactorTableSkeleton,
  QueryErrorState,
} from "@/components/feedback";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListPagination } from "@/components/data-table/list-pagination";
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";
import { LIFECYCLE_STATUS } from "@/config/lifecycle";
import { ModelTable } from "@/modules/models/components/model-table";
import { useDrugOptions } from "@/modules/platform/hooks/use-drug-options";
import { listModels } from "@/services/model.service";

type StatusFilter =
  | typeof LIFECYCLE_STATUS.ACTIVE
  | typeof LIFECYCLE_STATUS.ARCHIVED
  | "all";

function ModelsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: drugOptions } = useDrugOptions();

  const drugIdFromUrl = searchParams.get("drugId") ?? "";

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    LIFECYCLE_STATUS.ACTIVE,
  );
  const [drugFilter, setDrugFilter] = useState(drugIdFromUrl);
  const debouncedSearch = useDebouncedValue(searchInput);

  useEffect(() => {
    setDrugFilter(drugIdFromUrl);
    setPage(1);
  }, [drugIdFromUrl]);

  const updateDrugFilter = useCallback(
    (drugId: string) => {
      setPage(1);
      setDrugFilter(drugId);
      const params = new URLSearchParams(searchParams.toString());
      if (drugId) {
        params.set("drugId", drugId);
      } else {
        params.delete("drugId");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const filteredDrugLabel = useMemo(() => {
    if (!drugFilter) {
      return null;
    }
    return drugOptions?.find((opt) => opt.value === drugFilter)?.label ?? null;
  }, [drugFilter, drugOptions]);

  const queryKey = useMemo(
    () => [
      "models",
      { page, search: debouncedSearch, status: statusFilter, drugId: drugFilter },
    ],
    [page, debouncedSearch, statusFilter, drugFilter],
  );

  const { data, isLoading, isFetching, error, refetch, isRefetching } =
    useQuery({
      queryKey,
      queryFn: async () => {
        const response = await listModels({
          page,
          limit: 20,
          search: debouncedSearch.trim() || undefined,
          drugId: drugFilter || undefined,
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

  const newModelHref = drugFilter
    ? `/models/new?drugId=${encodeURIComponent(drugFilter)}`
    : "/models/new";

  return (
    <>
      <PageHeader
        title="Models"
        description={
          <>
            Drug-scoped scientific workspaces — attach global factor sets in
            order.
            {filteredDrugLabel ? (
              <span className="mt-1 block">
                Filtered to{" "}
                <span className="font-medium text-[#f4f4f5]">
                  {filteredDrugLabel}
                </span>
                {" · "}
                <button
                  type="button"
                  className="text-cyan-400/90 underline-offset-4 hover:underline"
                  onClick={() => updateDrugFilter("")}
                >
                  Clear filter
                </button>
              </span>
            ) : null}
          </>
        }
        actions={
          <Link
            href={newModelHref}
            className={cn(buttonVariants({ variant: "default" }), platform.primaryButton)}
          >
            New model
          </Link>
        }
      />

      <ContentCard className="mb-4">
        <FilterBar>
          <FilterField id="model-search" label="Search" className="max-w-md flex-1">
            <Input
              id="model-search"
              placeholder="Search models…"
              value={searchInput}
              onChange={(e) => {
                setPage(1);
                setSearchInput(e.target.value);
              }}
              className={platform.input}
            />
          </FilterField>
          <FilterField id="model-drug-filter" label="Drug">
            <select
              id="model-drug-filter"
              className={cn(platform.select, "min-w-[180px]")}
              value={drugFilter}
              onChange={(e) => updateDrugFilter(e.target.value)}
            >
              <option value="">All drugs</option>
              {drugOptions?.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField id="model-status-filter" label="Status">
            <select
              id="model-status-filter"
              className={cn(platform.select, "min-w-[140px]")}
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
          </FilterField>
        </FilterBar>
      </ContentCard>

      {error ? (
        <QueryErrorState
          error={error}
          context={{ resource: "models" }}
          onRetry={() => {
            void queryClient.invalidateQueries({ queryKey: ["models"] });
            void refetch();
          }}
          isRetrying={isRefetching}
        />
      ) : null}

      {showSkeleton ? <FactorTableSkeleton /> : null}

      {data && !error ? (
        <ContentCard flush className="overflow-hidden">
          <ListToolbar
            total={data.pagination.total}
            meta={
              isFetching && !isLoading ? "Updating…" : undefined
            }
          />
          {data.items.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No models found"
                description={
                  debouncedSearch ||
                  statusFilter !== LIFECYCLE_STATUS.ACTIVE ||
                  drugFilter
                    ? "Try different filters or search terms."
                    : "Create a model under a drug to configure factor sets."
                }
                action={
                  <Link
                    href={newModelHref}
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      platform.primaryButton,
                    )}
                  >
                    New model
                  </Link>
                }
              />
            </div>
          ) : (
            <div
              className={cn(
                "max-h-[min(70vh,720px)] overflow-auto",
                isFetching && !isLoading && "opacity-60 transition-opacity",
              )}
            >
              <ModelTable items={data.items} variant="platform" />
            </div>
          )}
          {data.items.length > 0 ? (
            <div className="border-t border-white/[0.06] px-4 py-3">
              <ListPagination
                variant="platform"
                pagination={data.pagination}
                page={page}
                onPageChange={setPage}
                isFetching={isFetching}
              />
            </div>
          ) : null}
        </ContentCard>
      ) : null}
    </>
  );
}

export default function ModelsPage() {
  return (
    <PlatformShell
      domainId="workspace"
      breadcrumbs={[
        { label: "Workspace", href: "/models" },
        { label: "Models" },
      ]}
      contextLine="Scientific workspaces · configure factor set graphs per drug"
    >
      <Suspense fallback={<FactorTableSkeleton />}>
        <ModelsPageContent />
      </Suspense>
    </PlatformShell>
  );
}
