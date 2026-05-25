"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDateTime } from "@/lib/format-datetime";
import { listAuditLogs } from "@/services/audit.service";
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";

type EntityAuditPanelProps = {
  entityType: string;
  entityId: string;
  title?: string;
  variant?: "default" | "platform";
};

export function EntityAuditPanel({
  entityType,
  entityId,
  title = "Recent activity",
  variant = "default",
}: EntityAuditPanelProps) {
  const isPlatform = variant === "platform";
  const { data, isLoading, error } = useQuery({
    queryKey: ["audit-logs", entityType, entityId],
    queryFn: async () => {
      const response = await listAuditLogs({
        entityType,
        entityId,
        limit: 10,
      });
      return response.data;
    },
    enabled: Boolean(entityId),
  });

  if (isLoading) {
    return (
      <p
        className={cn(
          "text-sm",
          isPlatform ? "text-[#71717a]" : "text-muted-foreground",
        )}
      >
        Loading activity…
      </p>
    );
  }

  if (error) {
    return null;
  }

  const items = data?.items ?? [];
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-lg border p-4",
        isPlatform ? platform.card : "bg-card",
      )}
    >
      <h2
        className={cn(
          "mb-3 text-sm font-medium",
          isPlatform && "text-[#f4f4f5]",
        )}
      >
        {title}
      </h2>
      <ul className="space-y-2 text-sm">
        {items.map((entry) => (
          <li
            key={entry.id}
            className={cn(
              "flex flex-wrap items-baseline justify-between gap-2 border-b pb-2 last:border-0 last:pb-0",
              isPlatform ? "border-white/[0.06]" : "border-border/60",
            )}
          >
            <span>
              <span
                className={cn(
                  "font-medium capitalize",
                  isPlatform && "text-[#f4f4f5]",
                )}
              >
                {entry.action}
              </span>
              {entry.summary ? (
                <span
                  className={
                    isPlatform ? "text-[#71717a]" : "text-muted-foreground"
                  }
                >
                  {" "}
                  — {entry.summary}
                </span>
              ) : null}
              <span
                className={
                  isPlatform ? "text-[#52525b]" : "text-muted-foreground"
                }
              >
                {" "}
                by {entry.actor}
              </span>
            </span>
            <time
              className={cn(
                "text-xs",
                isPlatform ? "text-[#52525b]" : "text-muted-foreground",
              )}
            >
              {formatDateTime(entry.createdAt)}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
