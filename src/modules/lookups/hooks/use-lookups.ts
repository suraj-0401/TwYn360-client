"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchLookupOptions } from "../utils/fetch-lookup-options";

export function lookupQueryKey(collectionOrTypeCode: string) {
  return ["lookup-options", collectionOrTypeCode] as const;
}

/** Active lookup options — supports type codes (FACTOR_CATEGORY) and collection UUIDs. */
export function useLookups(collectionOrTypeCode: string) {
  return useQuery({
    queryKey: lookupQueryKey(collectionOrTypeCode),
    queryFn: () => fetchLookupOptions(collectionOrTypeCode),
    enabled: Boolean(collectionOrTypeCode),
    staleTime: 30_000,
  });
}
