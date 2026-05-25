import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ListToolbarProps = {
  title?: string;
  total?: number;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function ListToolbar({
  title = "Results",
  total,
  meta,
  actions,
  className,
}: ListToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2.5",
        className,
      )}
    >
      <div className="min-w-0 text-sm">
        <span className="font-medium text-[#f4f4f5]">{title}</span>
        {total !== undefined ? (
          <span className="ml-2 tabular-nums text-[#71717a]">
            {total} {total === 1 ? "item" : "items"}
          </span>
        ) : null}
        {meta ? (
          <span className="ml-2 text-[#52525b]">· {meta}</span>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
