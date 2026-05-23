"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { LIFECYCLE_STATUS } from "@/config/lifecycle";
import { listFactors } from "@/services/factor.service";
import { FACTOR_SET_MAX_MEMBERS } from "../constants";
import type { FactorListItem } from "@/types/factor";

type FactorPickerProps = {
  excludeFactorIds: string[];
  memberCount: number;
  onAdd: (factor: FactorListItem) => void;
  disabled?: boolean;
};

export function FactorPicker({
  excludeFactorIds,
  memberCount,
  onAdd,
  disabled = false,
}: FactorPickerProps) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const atLimit = memberCount >= FACTOR_SET_MAX_MEMBERS;

  const excludeSet = useMemo(
    () => new Set(excludeFactorIds),
    [excludeFactorIds],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["factor-picker", debouncedSearch],
    queryFn: async () => {
      const response = await listFactors({
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
      (data?.items ?? []).filter((factor) => !excludeSet.has(factor.id)),
    [data?.items, excludeSet],
  );

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div>
        <h2 className="text-sm font-medium">Add factors</h2>
        <p className="text-xs text-muted-foreground">
          Search the global registry for active factors to include in this set.
        </p>
      </div>

      {atLimit ? (
        <p className="text-sm text-muted-foreground">
          This set has reached the maximum of {FACTOR_SET_MAX_MEMBERS} members.
        </p>
      ) : (
        <>
          <div className="space-y-1">
            <Label htmlFor="factor-picker-search">Search factors</Label>
            <Input
              id="factor-picker-search"
              placeholder="Search by name or slug…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={disabled}
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <ul
              className="divide-y rounded-md border"
              aria-busy={isFetching}
            >
              {candidates.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  {debouncedSearch.trim()
                    ? "No matching active factors."
                    : "Type to search for factors."}
                </li>
              ) : (
                candidates.map((factor) => (
                  <li
                    key={factor.id}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {factor.displayName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {factor.slug} · {factor.dataTypeCode}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={disabled}
                      onClick={() => onAdd(factor)}
                    >
                      Add
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
