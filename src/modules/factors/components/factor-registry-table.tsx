"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { PlatformDataTable } from "@/components/data-table/platform-data-table";
import type { DataTableColumn } from "@/components/data-table/data-table";
import { buildRegistryActionsColumn } from "@/components/data-table/registry-actions-column";
import { cn } from "@/lib/utils";
import { getRegistryCellValue } from "@/modules/factors/utils/factor-workspace-values";
import type { FactorListColumn } from "@/modules/factors/utils/factor-workspace-values";
import type { FactorListItem } from "@/types/factor";

type FactorRegistryTableProps = {
  items: FactorListItem[];
  columns: FactorListColumn[];
  labelsByFieldId: Record<string, Map<string, string>>;
  variant?: "default" | "platform";
};

export function FactorRegistryTable({
  items,
  columns,
  labelsByFieldId,
  variant = "platform",
}: FactorRegistryTableProps) {
  const isPlatform = variant === "platform";

  const tableColumns = useMemo((): DataTableColumn<FactorListItem>[] => {
    const dataColumns: DataTableColumn<FactorListItem>[] = columns.map((col) => ({
      id: col.fieldId,
      header: col.label,
      className: col.fieldId === "displayName" ? undefined : "text-[#a1a1aa]",
      cell: (factor: FactorListItem) => {
        const raw = getRegistryCellValue(factor, col.fieldId);
        const display =
          raw === null || raw === undefined || raw === ""
            ? "—"
            : col.kind === "boolean"
              ? raw
                ? "Yes"
                : "No"
              : col.kind === "lookup"
                ? (labelsByFieldId[col.fieldId]?.get(String(raw)) ?? String(raw))
                : String(raw);

        const isNameCol = col.fieldId === "displayName";

        return (
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                isNameCol && "font-medium text-[#f4f4f5]",
                !isNameCol && isPlatform && "text-[#a1a1aa]",
              )}
            >
              {col.kind === "badge" ? (
                <Badge variant="secondary">{display}</Badge>
              ) : (
                display
              )}
            </span>
          </div>
        );
      },
    }));

    if (!isPlatform) {
      return dataColumns;
    }

    return [
      ...dataColumns,
      buildRegistryActionsColumn<FactorListItem>((factor) => ({
        viewHref: `/factors/${factor.id}`,
        editHref: `/factors/${factor.id}/edit`,
      })),
    ];
  }, [columns, labelsByFieldId, isPlatform]);

  if (columns.length === 0) {
    return (
      <p className={cn("text-sm", isPlatform ? "text-[#71717a]" : "text-muted-foreground")}>
        Enable &quot;Show in registry table&quot; on workspace fields to define
        columns.
      </p>
    );
  }

  return (
    <PlatformDataTable
      columns={tableColumns}
      items={items}
      getRowKey={(factor) => factor.id}
      stickyHeader={isPlatform}
    />
  );
}
