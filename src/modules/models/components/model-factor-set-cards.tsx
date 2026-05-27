"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/data-table/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";
import { MUTATION_ACTION_LABEL } from "@/config/mutation-labels";
import { formatFactorSetLinkDescription } from "../utils/factor-set-lifecycle";
import type { ModelFactorSetRow } from "./model-factor-set-list";

type ModelFactorSetCardsProps = {
  rows: ModelFactorSetRow[];
  readOnly?: boolean;
  graphLocked?: boolean;
  busyFactorSetId?: string | null;
  onDetach?: (factorSetId: string) => void | Promise<void>;
  onMoveUp?: (factorSetId: string) => void;
  onMoveDown?: (factorSetId: string) => void;
};

export function ModelFactorSetCards({
  rows,
  readOnly = false,
  graphLocked = false,
  busyFactorSetId = null,
  onDetach,
  onMoveUp,
  onMoveDown,
}: ModelFactorSetCardsProps) {
  if (rows.length === 0) {
    return (
      <p
        className={cn(
          "rounded-lg border border-dashed px-6 py-12 text-center text-sm",
          "border-white/[0.08] text-[#71717a]",
        )}
      >
        No factor sets attached yet. Search and attach global factor sets below.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {rows.map((row, index) => {
        const set = row.link.factorSet;
        const busy = busyFactorSetId === row.factorSetId;

        return (
          <li
            key={row.factorSetId}
            className={cn(platform.card, "flex flex-col gap-4 p-4 sm:flex-row sm:items-center")}
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-xs font-medium tabular-nums text-[#71717a]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-medium text-[#f4f4f5]">
                    {set.displayName}
                  </h3>
                  <StatusBadge status={set.statusCode} />
                </div>
                <p className="font-mono text-xs text-[#52525b]">{set.slug}</p>
                <p className="mt-1 text-sm text-[#71717a]">
                  {formatFactorSetLinkDescription(set, graphLocked)}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              <Link
                href={`/factor-sets/${row.factorSetId}/edit`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04]",
                )}
              >
                <ExternalLink className="size-3.5" />
                Open
              </Link>
              {!readOnly ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-label="Move up"
                    disabled={busy || index === 0}
                    className="border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04]"
                    onClick={() => onMoveUp?.(row.factorSetId)}
                  >
                    <ArrowUp className="size-3.5" />
                    Move up
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-label="Move down"
                    disabled={busy || index === rows.length - 1}
                    className="border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04]"
                    onClick={() => onMoveDown?.(row.factorSetId)}
                  >
                    <ArrowDown className="size-3.5" />
                    Move down
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    className="border-red-500/20 text-red-400/90 hover:bg-red-500/10"
                    onClick={() => void onDetach?.(row.factorSetId)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    {MUTATION_ACTION_LABEL.detachFactorSet}
                  </Button>
                </>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
