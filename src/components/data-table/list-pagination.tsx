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

  return (
    <div
      className={
        className ??
        (isPlatform
          ? "flex items-center justify-between"
          : "mt-4 flex items-center justify-between")
      }
    >
      <p
        className={
          isPlatform
            ? "text-sm text-[#71717a]"
            : "text-sm text-muted-foreground"
        }
      >
        Page {pagination.page} of {pagination.totalPages}
        <span className="tabular-nums"> · {pagination.total} total</span>
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isFetching}
          onClick={() => onPageChange(Math.max(page - 1, 1))}
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
          disabled={page >= pagination.totalPages || isFetching}
          onClick={() => onPageChange(page + 1)}
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
