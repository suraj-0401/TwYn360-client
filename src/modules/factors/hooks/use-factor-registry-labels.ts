"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchLookupOptions } from "@/modules/lookups/utils/fetch-lookup-options";
import { lookupQueryKey } from "@/modules/lookups/hooks/lookup-query-key";

/** Load lookup labels once per unique collection (shared across columns/filters). */
export function useFactorRegistryLabels(
  sources: Record<string, string>,
) {
  const collectionIds = useMemo(
    () => [...new Set(Object.values(sources).filter(Boolean))],
    [sources],
  );

  const collectionIndex = useMemo(() => {
    const map = new Map<string, number>();
    collectionIds.forEach((id, index) => map.set(id, index));
    return map;
  }, [collectionIds]);

  const queries = useQueries({
    queries: collectionIds.map((collectionId) => ({
      queryKey: lookupQueryKey(collectionId),
      queryFn: () => fetchLookupOptions(collectionId),
      enabled: Boolean(collectionId),
      staleTime: 10 * 60 * 1000,
    })),
  });

  const labelsByCollectionId = useMemo(() => {
    const maps = new Map<string, Map<string, string>>();
    collectionIds.forEach((collectionId, index) => {
      const rows = queries[index]?.data;
      maps.set(
        collectionId,
        new Map(rows?.map((item) => [item.code, item.label]) ?? []),
      );
    });
    return maps;
  }, [collectionIds, queries]);

  const labelsByFieldId = useMemo(() => {
    const result: Record<string, Map<string, string>> = {};
    for (const [fieldId, collectionId] of Object.entries(sources)) {
      result[fieldId] =
        labelsByCollectionId.get(collectionId) ?? new Map<string, string>();
    }
    return result;
  }, [sources, labelsByCollectionId]);

  return { labelsByFieldId };
}
