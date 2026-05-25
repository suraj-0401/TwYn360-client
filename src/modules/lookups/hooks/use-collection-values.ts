"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchLookupOptions } from "../utils/fetch-lookup-options";

export function collectionValuesQueryKey(collectionId: string) {
  return ["lookup-options", collectionId] as const;
}

export function useCollectionValues(collectionId: string) {
  return useQuery({
    queryKey: collectionValuesQueryKey(collectionId),
    queryFn: async () => {
      const rows = await fetchLookupOptions(collectionId);
      return rows.map((item) => ({
        id: item.valueId ?? item.code,
        valueId: item.valueId,
        code: item.code,
        label: item.label,
        description: item.description ?? null,
        displayOrder: item.displayOrder ?? 0,
        isSystem: item.isSystem ?? false,
        metadata: item.metadata ?? null,
      }));
    },
    enabled: Boolean(collectionId),
    staleTime: 30_000,
  });
}
