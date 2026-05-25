"use client";

import { FactorSetPicker } from "./factor-set-picker";
import { ModelFactorSetCards } from "./model-factor-set-cards";
import { ModelFactorSetList } from "./model-factor-set-list";
import {
  useModelFactorSets,
  type ModelFactorSetActions,
} from "../hooks/use-model-factor-sets";
import type { ModelFactorSetLink } from "@/types/model";

type ModelFactorSetsSectionProps = {
  modelId: string;
  factorSets: ModelFactorSetLink[];
  readOnly?: boolean;
  /** True when model is not draft — graph changes blocked. */
  graphLocked?: boolean;
  layout?: "default" | "workspace";
  actions?: ModelFactorSetActions;
  onRemove?: (factorSetId: string) => void;
};

export function ModelFactorSetsSection({
  modelId,
  factorSets,
  readOnly = false,
  graphLocked = false,
  layout = "default",
  actions: actionsProp,
  onRemove: onRemoveProp,
}: ModelFactorSetsSectionProps) {
  const internalActions = useModelFactorSets(modelId, factorSets);
  const actions = actionsProp ?? internalActions;
  const { rows, excludeFactorSetIds, busyFactorSetId, handleAdd, handleRemove, handleReorder } =
    actions;

  const isWorkspace = layout === "workspace";

  const removeHandler = onRemoveProp ?? handleRemove;

  if (isWorkspace) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#f4f4f5]">
            Attached factor sets
          </h2>
          <p className="mt-1 text-sm text-[#71717a]">
            Ordered global factor sets included in this model ({rows.length}{" "}
            total).
          </p>
          {readOnly ? (
            <p className="mt-2 text-xs text-amber-400/90">
              {graphLocked
                ? "Factor sets can only be changed while the model is in draft."
                : "Archived models are read-only."}
            </p>
          ) : null}
        </div>

        <ModelFactorSetCards
          rows={rows}
          readOnly={readOnly}
          busyFactorSetId={busyFactorSetId}
          onRemove={readOnly ? undefined : removeHandler}
          onMoveUp={
            readOnly ? undefined : (factorSetId) => handleReorder(factorSetId, -1)
          }
          onMoveDown={
            readOnly ? undefined : (factorSetId) => handleReorder(factorSetId, 1)
          }
        />

        {!readOnly ? (
          <FactorSetPicker
            excludeFactorSetIds={excludeFactorSetIds}
            linkCount={rows.length}
            onAdd={handleAdd}
            disabled={readOnly}
            variant="platform"
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium">Factor sets</h2>
            <p className="text-xs text-muted-foreground">
              Ordered global factor sets in this model ({rows.length} total).
            </p>
          </div>
          {readOnly ? (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Archived models are read-only.
            </p>
          ) : null}
        </div>

        {!readOnly ? (
          <div className="mb-4">
            <FactorSetPicker
              excludeFactorSetIds={excludeFactorSetIds}
              linkCount={rows.length}
              onAdd={handleAdd}
              disabled={readOnly}
            />
          </div>
        ) : null}

        <ModelFactorSetList
          rows={rows}
          readOnly={readOnly}
          busyFactorSetId={busyFactorSetId}
          onRemove={readOnly ? undefined : removeHandler}
          onMoveUp={
            readOnly ? undefined : (factorSetId) => handleReorder(factorSetId, -1)
          }
          onMoveDown={
            readOnly ? undefined : (factorSetId) => handleReorder(factorSetId, 1)
          }
        />
      </div>
    </div>
  );
}
