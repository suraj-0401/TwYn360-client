"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRegistryCellValue } from "@/modules/factors/utils/factor-workspace-values";
import type { FactorListColumn } from "@/modules/factors/utils/factor-workspace-values";
import type { FactorListItem } from "@/types/factor";

type FactorRegistryTableProps = {
  items: FactorListItem[];
  columns: FactorListColumn[];
  labelsByFieldId: Record<string, Map<string, string>>;
};

export function FactorRegistryTable({
  items,
  columns,
  labelsByFieldId,
}: FactorRegistryTableProps) {
  if (columns.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Enable &quot;Show in registry table&quot; on workspace fields to define
        columns.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.fieldId}>{col.label}</TableHead>
          ))}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((factor) => (
          <TableRow key={factor.id}>
            {columns.map((col) => {
              const raw = getRegistryCellValue(factor, col.fieldId);
              const display =
                raw === null || raw === undefined || raw === ""
                  ? "—"
                  : col.kind === "boolean"
                    ? raw
                      ? "Yes"
                      : "No"
                    : col.kind === "lookup"
                      ? (labelsByFieldId[col.fieldId]?.get(String(raw)) ??
                        String(raw))
                      : String(raw);

              return (
                <TableCell
                  key={col.fieldId}
                  className={
                    col.fieldId === "displayName" ? "font-medium" : undefined
                  }
                >
                  {col.kind === "badge" ? (
                    <Badge variant="secondary">{display}</Badge>
                  ) : (
                    display
                  )}
                </TableCell>
              );
            })}
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Link
                  href={`/factors/${factor.id}`}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  View
                </Link>
                <Link
                  href={`/factors/${factor.id}/edit`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Edit
                </Link>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
