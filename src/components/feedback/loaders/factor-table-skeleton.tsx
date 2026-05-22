import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type FactorTableSkeletonProps = {
  rows?: number;
};

export function FactorTableSkeleton({ rows = 6 }: FactorTableSkeletonProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: 7 }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4 w-16" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, row) => (
          <TableRow key={row}>
            {Array.from({ length: 7 }).map((_, col) => (
              <TableCell key={col}>
                <Skeleton
                  className={cn(
                    "h-4",
                    col === 0 ? "w-24" : col === 6 ? "ml-auto w-12" : "w-20",
                  )}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
