"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import {
  addModelFactorSet,
  removeModelFactorSet,
  reorderModelFactorSets,
} from "@/services/model.service";
import type { FactorSetListItem } from "@/types/factor-set";
import type { ModelFactorSetLink } from "@/types/model";
import type { ModelFactorSetRow } from "../components/model-factor-set-list";

function linksToRows(links: ModelFactorSetLink[]): ModelFactorSetRow[] {
  return [...links]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((link) => ({
      factorSetId: link.factorSetId,
      link,
    }));
}

function reorderIds(rows: ModelFactorSetRow[], factorSetId: string, delta: -1 | 1) {
  const ids = rows.map((row) => row.factorSetId);
  const index = ids.indexOf(factorSetId);
  if (index < 0) {
    return ids;
  }
  const target = index + delta;
  if (target < 0 || target >= ids.length) {
    return ids;
  }
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export type ModelFactorSetActions = ReturnType<typeof useModelFactorSets>;

export function useModelFactorSets(
  modelId: string,
  factorSets: ModelFactorSetLink[],
) {
  const queryClient = useQueryClient();
  const [busyFactorSetId, setBusyFactorSetId] = useState<string | null>(null);

  const rows = useMemo(() => linksToRows(factorSets), [factorSets]);
  const excludeFactorSetIds = useMemo(
    () => rows.map((row) => row.factorSetId),
    [rows],
  );

  async function refreshModel() {
    await queryClient.invalidateQueries({ queryKey: ["models", modelId] });
    void queryClient.invalidateQueries({ queryKey: ["models"] });
    void queryClient.invalidateQueries({ queryKey: ["drug-models"] });
  }

  async function runLinkMutation(
    factorSetId: string,
    action: () => Promise<unknown>,
    successMessage: string,
  ) {
    setBusyFactorSetId(factorSetId);
    try {
      await action();
      toast.success(successMessage);
      await refreshModel();
    } finally {
      setBusyFactorSetId(null);
    }
  }

  function handleAdd(set: FactorSetListItem) {
    void runLinkMutation(
      set.id,
      () => addModelFactorSet(modelId, { factorSetId: set.id }),
      "Factor set attached",
    );
  }

  function handleRemove(factorSetId: string) {
    void runLinkMutation(
      factorSetId,
      () => removeModelFactorSet(modelId, factorSetId),
      "Factor set removed",
    );
  }

  function handleReorder(factorSetId: string, delta: -1 | 1) {
    const orderedFactorSetIds = reorderIds(rows, factorSetId, delta);
    void runLinkMutation(
      factorSetId,
      () => reorderModelFactorSets(modelId, { orderedFactorSetIds }),
      "Factor set order updated",
    );
  }

  return {
    rows,
    excludeFactorSetIds,
    busyFactorSetId,
    handleAdd,
    handleRemove,
    handleReorder,
  };
}
