"use client";

import { formatLifecycleStatus } from "@/config/lifecycle";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  archived: "bg-amber-500/15 text-amber-800 dark:text-amber-400",
  deleted: "bg-destructive/15 text-destructive",
};

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const code = status.trim().toLowerCase();
  const variant =
    STATUS_VARIANT[code] ?? "bg-muted text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
        variant,
        className,
      )}
    >
      {formatLifecycleStatus(code)}
    </span>
  );
}
