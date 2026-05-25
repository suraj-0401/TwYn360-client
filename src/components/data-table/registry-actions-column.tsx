import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DataTableColumn } from "./data-table";

const actionButtonClass =
  "border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04]";

export type RegistryRowActions = {
  viewHref: string;
  editHref: string;
  extra?: { label: string; href: string };
};

export function buildRegistryActionsColumn<T>(
  getActions: (row: T) => RegistryRowActions,
): DataTableColumn<T> {
  return {
    id: "actions",
    header: "Actions",
    headerClassName: "text-right w-[1%] whitespace-nowrap",
    className: "text-right whitespace-nowrap",
    cell: (row) => {
      const { viewHref, editHref, extra } = getActions(row);
      return (
        <div
          className="flex justify-end gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Link
            href={viewHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              actionButtonClass,
            )}
          >
            View
          </Link>
          <Link
            href={editHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              actionButtonClass,
            )}
          >
            Edit
          </Link>
          {extra ? (
            <Link
              href={extra.href}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                actionButtonClass,
              )}
            >
              {extra.label}
            </Link>
          ) : null}
        </div>
      );
    },
  };
}

/** Read-only list/detail via `?view=1` on an edit route. */
export function registryViewHref(editPath: string): string {
  return `${editPath}?view=1`;
}
