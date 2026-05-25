"use client";

import { useQuery } from "@tanstack/react-query";
import { getModelFieldConfig } from "@/services/model.service";

export const modelFieldConfigQueryKey = ["models", "field-config"] as const;

export function useModelFieldConfig() {
  return useQuery({
    queryKey: modelFieldConfigQueryKey,
    queryFn: async () => (await getModelFieldConfig()).data,
    staleTime: 10 * 60 * 1000,
  });
}
