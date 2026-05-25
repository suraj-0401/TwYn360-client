"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { LIFECYCLE_STATUS } from "@/config/lifecycle";
import { listFactorSets } from "@/services/factor-set.service";
import { MODEL_MAX_FACTOR_SETS } from "../constants";
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";
import type { FactorSetListItem } from "@/types/factor-set";

type FactorSetPickerProps = {
  excludeFactorSetIds: string[];
  linkCount: number;
  onAdd: (factorSet: FactorSetListItem) => void;
  disabled?: boolean;
  variant?: "default" | "platform";
};

export function FactorSetPicker({
  excludeFactorSetIds,
  linkCount,
  onAdd,
  disabled = false,
  variant = "default",
}: FactorSetPickerProps) {
  const isPlatform = variant === "platform";
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const atLimit = linkCount >= MODEL_MAX_FACTOR_SETS;

  const excludeSet = useMemo(
    () => new Set(excludeFactorSetIds),
    [excludeFactorSetIds],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["factor-set-picker", debouncedSearch],
    queryFn: async () => {
      const response = await listFactorSets({
        page: 1,
        limit: 20,
        search: debouncedSearch.trim() || undefined,
        statusCode: LIFECYCLE_STATUS.ACTIVE,
      });
      return response.data;
    },
    staleTime: 30_000,
    enabled: !disabled && !atLimit,
  });

  const candidates = useMemo(
    () =>
      (data?.items ?? []).filter((set) => !excludeSet.has(set.id)),
    [data?.items, excludeSet],
  );

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border p-4",
        isPlatform ? platform.card : "bg-card",
      )}
    >
      <div>
        <h2
          className={cn(
            "text-sm font-medium",
            isPlatform && "text-[#f4f4f5]",
          )}
        >
          Attach factor sets
        </h2>
        <p
          className={cn(
            "text-xs",
            isPlatform ? "text-[#71717a]" : "text-muted-foreground",
          )}
        >
          Search active global factor sets to include in this model.
        </p>
      </div>

      {atLimit ? (
        <p className="text-sm text-muted-foreground">
          This model has reached the maximum of {MODEL_MAX_FACTOR_SETS} factor
          sets.
        </p>
      ) : (
        <>
          <div className="space-y-1">
            <Label htmlFor="factor-set-picker-search">Search factor sets</Label>
            <Input
              id="factor-set-picker-search"
              placeholder="Search by name or slug…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={disabled}
              className={isPlatform ? platform.input : undefined}
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <ul
              className={cn(
                "divide-y rounded-md border",
                isPlatform && "border-white/[0.08] divide-white/[0.06]",
              )}
              aria-busy={isFetching}
            >
              {candidates.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  {debouncedSearch.trim()
                    ? "No matching active factor sets."
                    : "Type to search for factor sets."}
                </li>
              ) : (
                candidates.map((set) => (
                  <li
                    key={set.id}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {set.displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {set.slug} · {set.memberCount} factors
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={disabled}
                      onClick={() => onAdd(set)}
                    >
                      Attach
                    </Button>
                  </li>
                ))
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
