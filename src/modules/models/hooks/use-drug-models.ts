"use client";

import { useQuery } from "@tanstack/react-query";
import { listModelsForDrug } from "@/services/model.service";
import type { ModelSummary } from "@/types/model";

export function drugModelsQueryKey(drugId: string) {
  return ["drug-models", drugId] as const;
}

type UseDrugModelsOptions = {
  limit?: number;
  includeArchived?: boolean;
};

export function useDrugModels(
  drugId: string,
  options?: UseDrugModelsOptions,
) {
  const limit = options?.limit ?? 50;
  const includeArchived = options?.includeArchived ?? true;

  return useQuery({
    queryKey: [...drugModelsQueryKey(drugId), { limit, includeArchived }],
    queryFn: async (): Promise<ModelSummary[]> => {
      const response = await listModelsForDrug(drugId, {
        limit,
        includeArchived,
      });
      return response.data.items;
    },
    enabled: Boolean(drugId),
    staleTime: 60_000,
  });
}
