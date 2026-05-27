"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { MUTATION_ACTION_LABEL } from "@/config/mutation-labels";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FactorSummary } from "@/types/factor-set";

export type FactorSetMemberRow = {
  factorId: string;
  factor: FactorSummary;
};

type FactorSetMemberListProps = {
  members: FactorSetMemberRow[];
  onRemove?: (factorId: string) => void;
  onMoveUp?: (factorId: string) => void;
  onMoveDown?: (factorId: string) => void;
  readOnly?: boolean;
  busyFactorId?: string | null;
};

export function FactorSetMemberList({
  members,
  onRemove,
  onMoveUp,
  onMoveDown,
  readOnly = false,
  busyFactorId = null,
}: FactorSetMemberListProps) {
  if (members.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        No factors in this set yet. Use the picker above to add registry
        factors.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Factor</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member, index) => {
          const busy = busyFactorId === member.factorId;

          return (
            <TableRow key={member.factorId}>
              <TableCell className="tabular-nums text-muted-foreground">
                {index + 1}
              </TableCell>
              <TableCell>
                <Link
                  href={`/factors/${member.factorId}`}
                  className="font-medium hover:underline"
                >
                  {member.factor.displayName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {member.factor.slug}
                </p>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {member.factor.dataTypeCode}
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
                      onClick={() => onMoveUp?.(member.factorId)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Move down"
                      disabled={busy || index === members.length - 1}
                      onClick={() => onMoveDown?.(member.factorId)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label={MUTATION_ACTION_LABEL.removeFromSet}
                      disabled={busy}
                      onClick={() => onRemove?.(member.factorId)}
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
