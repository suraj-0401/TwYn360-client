"use client";

import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/platform/pagination";

type ListPaginationProps = {
  pagination: PaginationMeta;
  page: number;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
  className?: string;
  variant?: "default" | "platform";
};

export function ListPagination({
  pagination,
  page,
  onPageChange,
  isFetching = false,
  className,
  variant = "default",
}: ListPaginationProps) {
  const isPlatform = variant === "platform";

  const totalPages = Math.max(1, pagination.totalPages || 1);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const showPageControls = totalPages > 1;

  return (
    <div
      className={
        className ??
        (isPlatform
          ? "flex flex-wrap items-center justify-between gap-3"
          : "mt-4 flex flex-wrap items-center justify-between gap-3")
      }
    >
      <p
        className={
          isPlatform
            ? "text-sm text-[#a1a1aa]"
            : "text-sm text-muted-foreground"
        }
      >
        Page {currentPage} of {totalPages}
        <span className="tabular-nums text-[#71717a]"> · {pagination.total} total</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!showPageControls || currentPage <= 1 || isFetching}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          className={
            isPlatform
              ? "border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04] hover:text-[#f4f4f5]"
              : undefined
          }
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!showPageControls || currentPage >= totalPages || isFetching}
          onClick={() => onPageChange(currentPage + 1)}
          className={
            isPlatform
              ? "border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04] hover:text-[#f4f4f5]"
              : undefined
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
}
