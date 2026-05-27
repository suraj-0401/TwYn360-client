"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { LIFECYCLE_STATUS } from "@/config/lifecycle";
import { listFactorSets, getFactorSet } from "@/services/factor-set.service";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { MODEL_MAX_FACTOR_SETS } from "../constants";
import type { FactorSetListItem } from "@/types/factor-set";

/* ── Accordion row ───────────────────────────────────────────────── */

type AccordionRowProps = {
  factorSet: FactorSetListItem;
  onAttach: (factorSet: FactorSetListItem) => void;
  busy: boolean;
};

function AccordionRow({ factorSet, onAttach, busy }: AccordionRowProps) {
  const [open, setOpen] = useState(false);

  const { data: detail, isLoading } = useQuery({
    queryKey: ["factor-set-detail", factorSet.id],
    queryFn: async () => (await getFactorSet(factorSet.id)).data,
    enabled: open,
    staleTime: 60_000,
  });

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Expand chevron */}
        <button
          type="button"
          className="flex flex-1 min-w-0 items-center gap-2 text-left"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[#71717a] transition-transform duration-200",
              open && "rotate-180",
            )}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#f4f4f5]">
              {factorSet.displayName}
            </p>
            <p className="truncate text-xs text-[#71717a]">
              {factorSet.slug} · {factorSet.memberCount}{" "}
              {factorSet.memberCount === 1 ? "factor" : "factors"}
            </p>
          </div>
        </button>

        {/* Attach button */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          className="shrink-0"
          onClick={() => onAttach(factorSet)}
        >
          {busy ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Plus className="mr-1 h-3 w-3" />
          )}
          Attach
        </Button>
      </div>

      {/* Accordion body — factors list */}
      {open ? (
        <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-3">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4 bg-white/[0.06]" />
              <Skeleton className="h-5 w-2/4 bg-white/[0.06]" />
            </div>
          ) : detail?.members && detail.members.length > 0 ? (
            <ul className="space-y-1">
              {detail.members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-baseline gap-2 text-xs text-[#a1a1aa]"
                >
                  <span className="text-[#71717a]">·</span>
                  <span className="font-medium text-[#d4d4d8]">
                    {m.factor.displayName}
                  </span>
                  <span className="text-[#52525b]">
                    {m.factor.dataTypeCode}
                    {m.factor.unitCode ? ` · ${m.factor.unitCode}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#52525b]">No factors in this set.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ── Modal ───────────────────────────────────────────────────────── */

type AttachFactorSetModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excludeFactorSetIds: string[];
  linkCount: number;
  onAdd: (factorSet: FactorSetListItem) => void;
};

export function AttachFactorSetModal({
  open,
  onOpenChange,
  excludeFactorSetIds,
  linkCount,
  onAdd,
}: AttachFactorSetModalProps) {
  const [searchInput, setSearchInput] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput);
  const atLimit = linkCount >= MODEL_MAX_FACTOR_SETS;

  const excludeSet = useMemo(
    () => new Set(excludeFactorSetIds),
    [excludeFactorSetIds],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["factor-set-picker-modal", debouncedSearch],
    queryFn: async () => {
      const response = await listFactorSets({
        page: 1,
        limit: 30,
        search: debouncedSearch.trim() || undefined,
        statusCode: LIFECYCLE_STATUS.ACTIVE,
      });
      return response.data;
    },
    staleTime: 30_000,
    enabled: open && !atLimit,
  });

  const candidates = useMemo(
    () => (data?.items ?? []).filter((s) => !excludeSet.has(s.id)),
    [data?.items, excludeSet],
  );

  async function handleAttach(factorSet: FactorSetListItem) {
    setBusyId(factorSet.id);
    try {
      onAdd(factorSet);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg w-full bg-[#0e0e10] border border-white/[0.08] text-[#f4f4f5]"
        aria-describedby="attach-factor-set-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-[#f4f4f5]">
            Attach factor sets
          </DialogTitle>
          <DialogDescription
            id="attach-factor-set-desc"
            className="text-xs text-[#71717a]"
          >
            Search active global factor sets. Expand a row to preview the
            factors inside before attaching.
          </DialogDescription>
        </DialogHeader>

        {atLimit ? (
          <p className="text-sm text-[#71717a]">
            This model has reached the maximum of {MODEL_MAX_FACTOR_SETS} factor
            sets.
          </p>
        ) : (
          <div className="space-y-3">
            <Input
              placeholder="Search by name or slug…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-white/[0.04] border-white/[0.08] text-[#f4f4f5] placeholder:text-[#52525b]"
              autoFocus
            />

            <div
              className="max-h-[340px] overflow-y-auto space-y-2 pr-1"
              aria-busy={isFetching}
            >
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-14 w-full rounded-lg bg-white/[0.05]"
                    />
                  ))}
                </div>
              ) : candidates.length === 0 ? (
                <p className="py-4 text-center text-sm text-[#52525b]">
                  {debouncedSearch.trim()
                    ? "No matching active factor sets."
                    : "No available factor sets to attach."}
                </p>
              ) : (
                candidates.map((set) => (
                  <AccordionRow
                    key={set.id}
                    factorSet={set}
                    onAttach={handleAttach}
                    busy={busyId === set.id}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
