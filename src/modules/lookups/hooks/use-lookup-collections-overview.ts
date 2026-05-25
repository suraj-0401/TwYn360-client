"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getLookupCollectionOverviewByCode,
  listLookupCollectionsOverview,
} from "@/services/lookup-collection.service";

export const lookupCollectionsOverviewQueryKey = [
  "lookup-collections",
  "overview",
] as const;

export function lookupCollectionOverviewQueryKey(code: string) {
  return [...lookupCollectionsOverviewQueryKey, code] as const;
}

export function useLookupCollectionsOverview() {
  return useQuery({
    queryKey: lookupCollectionsOverviewQueryKey,
    queryFn: async () => (await listLookupCollectionsOverview()).data,
    staleTime: 60_000,
  });
}

export function useLookupCollectionOverview(code: string) {
  return useQuery({
    queryKey: lookupCollectionOverviewQueryKey(code),
    queryFn: async () => (await getLookupCollectionOverviewByCode(code)).data,
    enabled: Boolean(code),
    staleTime: 60_000,
  });
}
