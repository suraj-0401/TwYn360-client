"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";
import type { FactorSetMemberRow } from "./factor-set-member-list";

type FactorSetMemberCardsProps = {
  members: FactorSetMemberRow[];
  readOnly?: boolean;
  busyFactorId?: string | null;
  onRemove?: (factorId: string) => void;
  onMoveUp?: (factorId: string) => void;
  onMoveDown?: (factorId: string) => void;
};

export function FactorSetMemberCards({
  members,
  readOnly = false,
  busyFactorId = null,
  onRemove,
  onMoveUp,
  onMoveDown,
}: FactorSetMemberCardsProps) {
  if (members.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-white/[0.08] px-6 py-12 text-center text-sm text-[#71717a]">
        No factors in this set yet. Search and add registry factors below.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {members.map((member, index) => {
        const factor = member.factor;
        const busy = busyFactorId === member.factorId;

        return (
          <li
            key={member.factorId}
            className={cn(
              platform.card,
              "flex flex-col gap-4 p-4 sm:flex-row sm:items-center",
            )}
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-white/[0.04] text-xs font-medium tabular-nums text-[#71717a]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-medium text-[#f4f4f5]">
                  {factor.displayName}
                </h3>
                <p className="font-mono text-xs text-[#52525b]">{factor.slug}</p>
                <p className="mt-1 text-sm text-[#71717a]">
                  {factor.dataTypeCode ?? "—"}
                  {factor.categoryCode ? ` · ${factor.categoryCode}` : ""}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href={`/factors/${member.factorId}/edit`}
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
                    disabled={busy || index === 0}
                    className="border-white/10 bg-transparent text-[#a1a1aa]"
                    onClick={() => onMoveUp?.(member.factorId)}
                  >
                    <ArrowUp className="size-3.5" />
                    Up
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy || index === members.length - 1}
                    className="border-white/10 bg-transparent text-[#a1a1aa]"
                    onClick={() => onMoveDown?.(member.factorId)}
                  >
                    <ArrowDown className="size-3.5" />
                    Down
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    className="border-red-500/20 text-red-400/90 hover:bg-red-500/10"
                    onClick={() => onRemove?.(member.factorId)}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
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
