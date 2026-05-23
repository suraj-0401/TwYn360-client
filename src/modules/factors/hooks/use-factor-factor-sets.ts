"use client";

import { useQuery } from "@tanstack/react-query";
import { listFactorSetsForFactor } from "@/services/factor-set.service";
import type { FactorSetReference } from "@/types/factor-set";

export function factorFactorSetsQueryKey(factorId: string) {
  return ["factor-factor-sets", factorId] as const;
}

export function useFactorFactorSets(factorId: string) {
  return useQuery({
    queryKey: factorFactorSetsQueryKey(factorId),
    queryFn: async (): Promise<FactorSetReference[]> => {
      const response = await listFactorSetsForFactor(factorId);
      return response.data.items;
    },
    staleTime: 60_000,
  });
}
