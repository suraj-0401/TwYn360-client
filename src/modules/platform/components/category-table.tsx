"use client";

import { PlatformDataTable } from "@/components/data-table/platform-data-table";
import type { DataTableColumn } from "@/components/data-table/data-table";
import {
  buildRegistryActionsColumn,
  registryViewHref,
} from "@/components/data-table/registry-actions-column";
import { StatusBadge } from "@/components/data-table/status-badge";
import { formatDateTime } from "@/lib/format-datetime";
import type { EntityRecordListItemDto } from "@/types/entity-record";

const baseColumns: DataTableColumn<EntityRecordListItemDto>[] = [
  {
    id: "name",
    header: "Category",
    cell: (row) => (
      <span className="truncate font-medium text-[#f4f4f5]">
        {typeof row.values.name === "string"
          ? row.values.name
          : (row.displayName ?? "—")}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (row) => (
      <StatusBadge status={String(row.values.statusCode ?? row.status ?? "")} />
    ),
  },
  {
    id: "updated",
    header: "Updated",
    className: "whitespace-nowrap text-[#71717a]",
    cell: (row) => formatDateTime(row.updatedAt),
  },
];

type CategoryTableProps = {
  items: EntityRecordListItemDto[];
  variant?: "default" | "platform";
};

export function CategoryTable({
  items,
  variant = "platform",
}: CategoryTableProps) {
  const columns = [
    ...baseColumns,
    buildRegistryActionsColumn<EntityRecordListItemDto>((row) => {
      const editHref = `/categories/${row.id}/edit`;
      return {
        viewHref: registryViewHref(editHref),
        editHref,
      };
    }),
  ];

  return (
    <PlatformDataTable
      columns={columns}
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
