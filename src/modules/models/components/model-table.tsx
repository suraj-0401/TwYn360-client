"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data-table/data-table";
import { PlatformDataTable } from "@/components/data-table/platform-data-table";
import {
  buildRegistryActionsColumn,
  registryViewHref,
} from "@/components/data-table/registry-actions-column";
import { StatusBadge } from "@/components/data-table/status-badge";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format-datetime";
import { platform } from "@/styles/tokens";
import { useModelLookupLabels } from "../hooks/use-model-lookup-labels";
import type { ModelSummary } from "@/types/model";

function drugLabel(drug: ModelSummary["drug"]): string {
  return drug.displayName || drug.slug || drug.id;
}

function buildColumns(
  variant: "default" | "platform",
  frameworkLabel: (code: string | null) => string,
): DataTableColumn<ModelSummary>[] {
  const isPlatform = variant === "platform";

  return [
    {
      id: "model",
      header: "Model",
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-2">
          <div className="min-w-0">
            <div
              className={cn(
                "truncate font-medium",
                isPlatform ? "text-[#f4f4f5]" : undefined,
              )}
            >
              {row.displayName}
            </div>
            <p
              className={cn(
                "truncate text-xs",
                isPlatform ? "text-[#52525b]" : "text-muted-foreground",
              )}
            >
              {row.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "drug",
      header: "Drug",
      cell: (row) => (
        <Link
          href={`/drugs/${row.drugId}/edit`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            isPlatform ? platform.link : "hover:underline",
            "truncate",
          )}
        >
          {drugLabel(row.drug)}
        </Link>
      ),
    },
    {
      id: "framework",
      header: "Framework",
      className: isPlatform ? "text-[#71717a]" : "text-muted-foreground",
      cell: (row) => frameworkLabel(row.frameworkType),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.statusCode} />,
    },
    {
      id: "factorSets",
      header: "Sets",
      headerClassName: "text-right",
      className: cn(
        "text-right tabular-nums",
        isPlatform ? "text-[#a1a1aa]" : undefined,
      ),
      cell: (row) => row.factorSetCount,
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
}

type ModelTableProps = {
  items: ModelSummary[];
  variant?: "default" | "platform";
};

function withActions(
  columns: DataTableColumn<ModelSummary>[],
): DataTableColumn<ModelSummary>[] {
  return [
    ...columns,
    buildRegistryActionsColumn<ModelSummary>((row) => {
      const editHref = `/models/${row.id}/edit`;
      return {
        viewHref: `/models/${row.id}`,
        editHref,
      };
    }),
  ];
}

export function ModelTable({ items, variant = "default" }: ModelTableProps) {
  const { frameworkLabel } = useModelLookupLabels();
  const columns = withActions(buildColumns(variant, frameworkLabel));

  if (variant === "platform") {
    return (
      <PlatformDataTable
        columns={columns}
        items={items}
        getRowKey={(row) => row.id}
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      items={items}
      getRowKey={(row) => row.id}
    />
  );
}
