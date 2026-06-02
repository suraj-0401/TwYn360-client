import type { ReactNode } from "react";
import { ContentCard } from "@/components/layout/content-card";
import { ListToolbar } from "@/components/data-table/list-toolbar";
import { ListPagination } from "@/components/data-table/list-pagination";
import type { PaginationMeta } from "@/platform/pagination";
import { cn } from "@/lib/utils";

type RegistryListCardProps = {
  total?: number;
  meta?: ReactNode;
  isFetching?: boolean;
  isLoading?: boolean;
  empty?: ReactNode;
  children?: ReactNode;
  className?: string;
  pagination?: {
    meta: PaginationMeta;
    page: number;
    onPageChange: (page: number) => void;
    isFetching?: boolean;
  };
};

export function RegistryListCard({
  total,
  meta,
  isFetching = false,
  isLoading = false,
  empty,
  children,
  className,
  pagination,
}: RegistryListCardProps) {
  const showEmpty = empty !== undefined && !children;

  return (
    <ContentCard
      flush
      className={cn(
        "flex min-h-[min(320px,50vh)] flex-col overflow-hidden",
        className,
      )}
    >
      <div className="shrink-0">
        <ListToolbar
          total={total}
          meta={
            meta ??
            (isFetching && !isLoading ? "Updating…" : undefined)
          }
        />
      </div>
      {showEmpty ? <div className="flex-1 p-8">{empty}</div> : null}
      {children ? (
        <div
          className={cn(
            "min-h-0 flex-1 overflow-auto",
            isFetching && !isLoading && "opacity-60 transition-opacity",
          )}
        >
          {children}
        </div>
      ) : null}
      {pagination && !showEmpty ? (
        <div className="shrink-0 border-t border-white/[0.08] bg-[#0f0f11] px-4 py-3">
          <ListPagination
            variant="platform"
            pagination={pagination.meta}
            page={pagination.page}
            onPageChange={pagination.onPageChange}
            isFetching={pagination.isFetching}
          />
        </div>
      ) : null}
    </ContentCard>
  );
}
