"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  MODEL_FRAMEWORK_TYPE_LOOKUP,
  MODEL_STATUS_LOOKUP,
} from "@/config/models";
import { lookupQueryKey } from "@/modules/lookups/hooks/lookup-query-key";
import { fetchLookupOptions } from "@/modules/lookups/utils/fetch-lookup-options";

/** Resolve lookup labels for model list/detail (framework + status). */
export function useModelLookupLabels() {
  const collectionIds = [MODEL_STATUS_LOOKUP, MODEL_FRAMEWORK_TYPE_LOOKUP];

  const queries = useQueries({
    queries: collectionIds.map((collectionId) => ({
      queryKey: lookupQueryKey(collectionId),
      queryFn: () => fetchLookupOptions(collectionId),
      staleTime: 10 * 60 * 1000,
    })),
  });

  const labelsByCollection = useMemo(() => {
    const maps = new Map<string, Map<string, string>>();
    collectionIds.forEach((collectionId, index) => {
      const rows = queries[index]?.data;
      maps.set(
        collectionId,
        new Map(rows?.map((item) => [item.code, item.label]) ?? []),
      );
    });
    return maps;
  }, [queries]);

  function frameworkLabel(code: string | null): string {
    if (!code) {
      return "—";
    }
    return (
      labelsByCollection.get(MODEL_FRAMEWORK_TYPE_LOOKUP)?.get(code) ?? code
    );
  }

  function statusLabel(code: string): string {
    return labelsByCollection.get(MODEL_STATUS_LOOKUP)?.get(code) ?? code;
  }

  const isLoading = queries.some((q) => q.isLoading);

  return { frameworkLabel, statusLabel, isLoading };
}
