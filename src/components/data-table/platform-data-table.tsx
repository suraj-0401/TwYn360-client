"use client";

import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";
import type { DataTableColumn } from "./data-table";

export type PlatformDataTableProps<T> = {
  columns: DataTableColumn<T>[];
  items: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: ReactNode;
  className?: string;
  stickyHeader?: boolean;
};

export function PlatformDataTable<T>({
  columns,
  items,
  getRowKey,
  onRowClick,
  emptyMessage,
  className,
  stickyHeader = true,
}: PlatformDataTableProps<T>) {
  if (items.length === 0 && emptyMessage) {
    return <>{emptyMessage}</>;
  }

  return (
    <div className={cn("relative w-full overflow-x-auto", className)}>
      <Table>
        <TableHeader
          className={cn(stickyHeader && "sticky top-0 z-10 bg-[#111113]")}
        >
          <TableRow className="border-white/[0.06] hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  platform.tableHead,
                  column.headerClassName,
                  column.className,
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow
              key={getRowKey(row)}
              data-clickable={onRowClick ? true : undefined}
              className={cn(platform.tableRow, onRowClick && "group")}
              onClick={
                onRowClick
                  ? () => {
                      onRowClick(row);
                    }
                  : undefined
              }
            >
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  className={cn(platform.tableCell, column.className)}
                >
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
