"use client";

import { useQuery } from "@tanstack/react-query";
import { listLookupCollections } from "@/services/lookup-collection.service";

export function lookupCollectionsQueryKey() {
  return ["lookup-collections"] as const;
}

export function useLookupCollections() {
  return useQuery({
    queryKey: lookupCollectionsQueryKey(),
    queryFn: async () => {
      const response = await listLookupCollections();
      return response.data;
    },
    staleTime: 60_000,
  });
}
