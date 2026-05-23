"use client";

import Link from "next/link";
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
import { formatLifecycleStatus } from "@/config/lifecycle";
import { formatDateTime } from "@/lib/format-datetime";
import type { EntityRecordListItemDto } from "@/types/entity-record";

type DrugTableProps = {
  items: EntityRecordListItemDto[];
  categoryLabelById: Map<string, string>;
};

export function DrugTable({ items, categoryLabelById }: DrugTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row) => {
          const categoryId =
            typeof row.values.categoryId === "string"
              ? row.values.categoryId
              : "";
          const categoryLabel = categoryId
            ? (categoryLabelById.get(categoryId) ?? categoryId)
            : "—";

          return (
            <TableRow key={row.id}>
              <TableCell className="font-medium">
                {typeof row.values.name === "string"
                  ? row.values.name
                  : row.displayName ?? "—"}
              </TableCell>
              <TableCell>{categoryLabel}</TableCell>
              <TableCell>
                {formatLifecycleStatus(String(row.values.statusCode ?? ""))}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(row.updatedAt)}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/drugs/${row.id}/edit`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Edit
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
