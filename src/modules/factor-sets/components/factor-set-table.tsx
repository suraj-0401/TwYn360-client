"use client";

import { StatusBadge } from "@/components/data-table/status-badge";
import { PlatformDataTable } from "@/components/data-table/platform-data-table";
import type { DataTableColumn } from "@/components/data-table/data-table";
import {
  buildRegistryActionsColumn,
  registryViewHref,
} from "@/components/data-table/registry-actions-column";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format-datetime";
import type { FactorSetListItem } from "@/types/factor-set";

const baseColumns: DataTableColumn<FactorSetListItem>[] = [
  {
    id: "name",
    header: "Factor set",
    cell: (row) => (
      <div className="min-w-0">
        <div className="truncate font-medium text-[#f4f4f5]">
          {row.displayName}
        </div>
        {row.description ? (
          <p className="truncate text-xs text-[#52525b]">{row.description}</p>
        ) : (
          <p className="truncate font-mono text-xs text-[#52525b]">{row.slug}</p>
        )}
      </div>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => <StatusBadge status={row.statusCode} />,
  },
  {
    id: "factors",
    header: "Factors",
    headerClassName: "text-right",
    className: "text-right tabular-nums text-[#a1a1aa]",
    cell: (row) => row.memberCount,
  },
  {
    id: "updated",
    header: "Updated",
    className: "whitespace-nowrap text-[#71717a]",
    cell: (row) => formatDateTime(row.updatedAt),
  },
];

type FactorSetTableProps = {
  items: FactorSetListItem[];
  variant?: "default" | "platform";
};

const columnsWithActions: DataTableColumn<FactorSetListItem>[] = [
  ...baseColumns,
  buildRegistryActionsColumn<FactorSetListItem>((row) => {
    const editHref = `/factor-sets/${row.id}/edit`;
    return {
      viewHref: registryViewHref(editHref),
      editHref,
    };
  }),
];

export function FactorSetTable({
  items,
  variant = "platform",
}: FactorSetTableProps) {
  return (
    <PlatformDataTable
      columns={columnsWithActions}
      items={items}
      getRowKey={(row) => row.id}
      stickyHeader={variant === "platform"}
      className={
        variant !== "platform"
          ? "[&_th]:normal-case [&_th]:tracking-normal"
          : undefined
      }
    />
  );
}
