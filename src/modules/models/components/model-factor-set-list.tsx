"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { MUTATION_ACTION_LABEL } from "@/config/mutation-labels";
import type { ModelFactorSetLink } from "@/types/model";

export type ModelFactorSetRow = {
  factorSetId: string;
  link: ModelFactorSetLink;
};

type ModelFactorSetListProps = {
  rows: ModelFactorSetRow[];
  onDetach?: (factorSetId: string) => void | Promise<void>;
  onMoveUp?: (factorSetId: string) => void;
  onMoveDown?: (factorSetId: string) => void;
  readOnly?: boolean;
  busyFactorSetId?: string | null;
  variant?: "default" | "platform";
};

export function ModelFactorSetList({
  rows,
  onDetach,
  onMoveUp,
  onMoveDown,
  readOnly = false,
  busyFactorSetId = null,
  variant = "default",
}: ModelFactorSetListProps) {
  const isPlatform = variant === "platform";

  if (rows.length === 0) {
    return (
      <p
        className={cn(
          "rounded-md border border-dashed px-4 py-8 text-center text-sm",
          isPlatform ? "border-white/[0.08] text-[#71717a]" : "text-muted-foreground",
        )}
      >
        No factor sets attached yet. Use the picker above to link global factor
        sets.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className={isPlatform ? "border-white/[0.06] hover:bg-transparent" : undefined}>
          <TableHead className={cn("w-12", isPlatform && "text-[#71717a]")}>#</TableHead>
          <TableHead className={isPlatform ? "text-[#71717a]" : undefined}>Factor set</TableHead>
          <TableHead className={cn("text-right", isPlatform && "text-[#71717a]")}>
            Factors
          </TableHead>
          <TableHead className={cn("text-right", isPlatform && "text-[#71717a]")}>
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => {
          const busy = busyFactorSetId === row.factorSetId;
          const set = row.link.factorSet;

          return (
            <TableRow
              key={row.factorSetId}
              className={isPlatform ? "border-white/[0.04]" : undefined}
            >
              <TableCell
                className={cn(
                  "tabular-nums",
                  isPlatform ? "text-[#52525b]" : "text-muted-foreground",
                )}
              >
                {index + 1}
              </TableCell>
              <TableCell>
                <Link
                  href={`/factor-sets/${row.factorSetId}/edit`}
                  className={cn(
                    "font-medium hover:underline",
                    isPlatform && "text-[#f4f4f5]",
                  )}
                >
                  {set.displayName}
                </Link>
                <p
                  className={cn(
                    "text-xs",
                    isPlatform ? "text-[#52525b]" : "text-muted-foreground",
                  )}
                >
                  {set.slug}
                </p>
                {set.description ? (
                  <p
                    className={cn(
                      "mt-0.5 line-clamp-1 text-xs",
                      isPlatform ? "text-[#71717a]" : "text-muted-foreground",
                    )}
                  >
                    {set.description}
                  </p>
                ) : null}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right tabular-nums",
                  isPlatform && "text-[#a1a1aa]",
                )}
              >
                {set.memberCount}
              </TableCell>
              <TableCell className="text-right">
                {readOnly ? null : (
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Move up"
                      disabled={busy || index === 0}
                      onClick={() => onMoveUp?.(row.factorSetId)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Move down"
                      disabled={busy || index === rows.length - 1}
                      onClick={() => onMoveDown?.(row.factorSetId)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={MUTATION_ACTION_LABEL.detachFactorSet}
                      disabled={busy}
                      onClick={() => void onDetach?.(row.factorSetId)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
