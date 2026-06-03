"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listModelFormulas } from "@/services/formula.service";
import { indexFormulasByTarget } from "@/modules/models/utils/formula-target-index";

export function useModelFormulas(modelId: string, enabled = true) {
  const query = useQuery({
    queryKey: ["model-formulas", modelId],
    queryFn: async () => (await listModelFormulas(modelId)).data,
    staleTime: 60_000,
    enabled: enabled && Boolean(modelId),
  });

  const byTarget = useMemo(
    () => indexFormulasByTarget(query.data),
    [query.data],
  );

  return { ...query, byTarget };
}
