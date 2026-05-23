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

type CategoryTableProps = {
  items: EntityRecordListItemDto[];
};

export function CategoryTable({ items }: CategoryTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">
              {typeof row.values.name === "string"
                ? row.values.name
                : row.displayName ?? "—"}
            </TableCell>
            <TableCell>
              {formatLifecycleStatus(String(row.values.statusCode ?? ""))}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(row.updatedAt)}
            </TableCell>
            <TableCell className="text-right">
              <Link
                href={`/categories/${row.id}/edit`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Edit
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
