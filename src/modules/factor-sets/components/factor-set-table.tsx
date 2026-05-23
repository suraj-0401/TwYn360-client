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
import type { FactorSetListItem } from "@/types/factor-set";

type FactorSetTableProps = {
  items: FactorSetListItem[];
};

export function FactorSetTable({ items }: FactorSetTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Factors</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <div className="font-medium">{row.displayName}</div>
              {row.description ? (
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {row.description}
                </p>
              ) : null}
            </TableCell>
            <TableCell>{formatLifecycleStatus(row.statusCode)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.memberCount}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateTime(row.updatedAt)}
            </TableCell>
            <TableCell className="text-right">
              <Link
                href={`/factor-sets/${row.id}/edit`}
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
