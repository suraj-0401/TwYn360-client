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

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  items: T[];
  getRowKey: (row: T) => string;
  className?: string;
  emptyMessage?: ReactNode;
  onRowClick?: (row: T) => void;
};

export function DataTable<T>({
  columns,
  items,
  getRowKey,
  className,
  emptyMessage,
  onRowClick,
}: DataTableProps<T>) {
  if (items.length === 0 && emptyMessage) {
    return <>{emptyMessage}</>;
  }

  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column.id}
              className={cn(column.headerClassName, column.className)}
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
            className={onRowClick ? "cursor-pointer" : undefined}
            onClick={
              onRowClick
                ? () => {
                    onRowClick(row);
                  }
                : undefined
            }
          >
            {columns.map((column) => (
              <TableCell key={column.id} className={column.className}>
                {column.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
