"use client";

import Link from "next/link";
import { PlatformDataTable } from "@/components/data-table/platform-data-table";
import type { DataTableColumn } from "@/components/data-table/data-table";
import {
  buildRegistryActionsColumn,
  registryViewHref,
} from "@/components/data-table/registry-actions-column";
import { StatusBadge } from "@/components/data-table/status-badge";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format-datetime";
import { platform } from "@/styles/tokens";
import type { EntityRecordListItemDto } from "@/types/entity-record";

type DrugTableProps = {
  items: EntityRecordListItemDto[];
  categoryLabelById: Map<string, string>;
  variant?: "default" | "platform";
};

function buildColumns(
  categoryLabelById: Map<string, string>,
  variant: "default" | "platform",
): DataTableColumn<EntityRecordListItemDto>[] {
  const isPlatform = variant === "platform";

  const dataColumns: DataTableColumn<EntityRecordListItemDto>[] = [
    {
      id: "name",
      header: "Drug",
      cell: (row) => {
        const name =
          typeof row.values.name === "string"
            ? row.values.name
            : (row.displayName ?? "—");

        return (
          <div className="min-w-0 truncate font-medium text-[#f4f4f5]">
            {name}
          </div>
        );
      },
    },
    {
      id: "category",
      header: "Category",
      className: isPlatform ? "text-[#71717a]" : undefined,
      cell: (row) => {
        const categoryId =
          typeof row.values.categoryId === "string" ? row.values.categoryId : "";
        return categoryId
          ? (categoryLabelById.get(categoryId) ?? categoryId)
          : "—";
      },
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
      className: cn(
        "whitespace-nowrap",
        isPlatform ? "text-[#71717a]" : "text-muted-foreground",
      ),
      cell: (row) => formatDateTime(row.updatedAt),
    },
  ];

  return [
    ...dataColumns,
    buildRegistryActionsColumn<EntityRecordListItemDto>((row) => {
      const editHref = `/drugs/${row.id}/edit`;
      return {
        viewHref: registryViewHref(editHref),
        editHref,
        extra: {
          label: "Models",
          href: `/models?drugId=${encodeURIComponent(row.id)}`,
        },
      };
    }),
  ];
}

export function DrugTable({
  items,
  categoryLabelById,
  variant = "platform",
}: DrugTableProps) {
  const columns = buildColumns(categoryLabelById, variant);

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
