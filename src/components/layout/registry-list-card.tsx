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
  pagination,
}: RegistryListCardProps) {
  const showEmpty = empty !== undefined && !children;

  return (
    <ContentCard flush className="overflow-hidden">
      <ListToolbar
        total={total}
        meta={
          meta ??
          (isFetching && !isLoading ? "Updating…" : undefined)
        }
      />
      {showEmpty ? <div className="p-8">{empty}</div> : null}
      {children ? (
        <div
          className={cn(
            "max-h-[min(70vh,720px)] overflow-auto",
            isFetching && !isLoading && "opacity-60 transition-opacity",
          )}
        >
          {children}
        </div>
      ) : null}
      {pagination && !showEmpty ? (
        <div className="border-t border-white/[0.06] px-4 py-3">
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
