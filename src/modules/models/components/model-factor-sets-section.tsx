"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useConfirm } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { mutationConfirm } from "@/config/mutation-labels";
import { getModelDetachImpact } from "@/services/governance-impact.service";
import { AttachFactorSetModal } from "./attach-factor-set-modal";
import { ModelFactorSetCards } from "./model-factor-set-cards";
import { ModelFactorSetList } from "./model-factor-set-list";
import {
  useModelFactorSets,
  type ModelFactorSetActions,
} from "../hooks/use-model-factor-sets";
import {
  draftModelUnavailableFactorSetBanner,
  isFactorSetUnavailable,
} from "../utils/factor-set-lifecycle";
import type { ModelFactorSetLink } from "@/types/model";

type ModelFactorSetsSectionProps = {
  modelId: string;
  factorSets: ModelFactorSetLink[];
  readOnly?: boolean;
  /** True when model is not draft — graph changes blocked. */
  graphLocked?: boolean;
  layout?: "default" | "workspace";
  actions?: ModelFactorSetActions;
};

export function ModelFactorSetsSection({
  modelId,
  factorSets,
  readOnly = false,
  graphLocked = false,
  layout = "default",
  actions: actionsProp,
}: ModelFactorSetsSectionProps) {
  const { confirm } = useConfirm();
  const internalActions = useModelFactorSets(modelId, factorSets);
  const actions = actionsProp ?? internalActions;
  const { rows, excludeFactorSetIds, busyFactorSetId, handleAdd, handleDetach, handleReorder } =
    actions;
  const [modalOpen, setModalOpen] = useState(false);

  const isWorkspace = layout === "workspace";

  async function detachHandler(factorSetId: string) {
    let impact;
    try {
      impact = (await getModelDetachImpact(modelId, factorSetId)).data;
    } catch {
      impact = undefined;
    }
    const ok = await confirm(mutationConfirm.detachFactorSetFromModel(impact));
    if (!ok) {
      return;
    }
    handleDetach(factorSetId);
  }
  const hasUnavailableLinkedSet = factorSets.some((link) =>
    isFactorSetUnavailable(link.factorSet.statusCode),
  );

  const attachModal = !readOnly ? (
    <AttachFactorSetModal
      open={modalOpen}
      onOpenChange={setModalOpen}
      excludeFactorSetIds={excludeFactorSetIds}
      linkCount={rows.length}
      onAdd={(fs) => {
        handleAdd(fs);
        setModalOpen(false);
      }}
    />
  ) : null;

  if (isWorkspace) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[#f4f4f5]">
              Attached factor sets
            </h2>
            <p className="mt-1 text-sm text-[#71717a]">
              Ordered global factor sets included in this model ({rows.length}{" "}
              total).
            </p>
            {readOnly && graphLocked ? (
              <p className="mt-2 text-xs text-amber-400/90">
                Archived models are read-only.
              </p>
            ) : null}
            {hasUnavailableLinkedSet ? (
              <p className="mt-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-amber-200/90">
                {draftModelUnavailableFactorSetBanner()}
              </p>
            ) : null}
          </div>

          {!readOnly ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Attach factor set
            </Button>
          ) : null}
        </div>

        <ModelFactorSetCards
          rows={rows}
          readOnly={readOnly}
          graphLocked={graphLocked}
          busyFactorSetId={busyFactorSetId}
          onDetach={readOnly ? undefined : detachHandler}
          onMoveUp={
            readOnly ? undefined : (factorSetId) => handleReorder(factorSetId, -1)
          }
          onMoveDown={
            readOnly ? undefined : (factorSetId) => handleReorder(factorSetId, 1)
          }
        />

        {attachModal}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium">Factor sets</h2>
            <p className="text-xs text-muted-foreground">
              Ordered global factor sets in this model ({rows.length} total).
            </p>
          </div>
          <div className="flex items-center gap-2">
            {readOnly ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Archived models are read-only.
              </p>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setModalOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Attach
              </Button>
            )}
          </div>
        </div>

        <ModelFactorSetList
          rows={rows}
          readOnly={readOnly}
          busyFactorSetId={busyFactorSetId}
          onDetach={readOnly ? undefined : detachHandler}
          onMoveUp={
            readOnly ? undefined : (factorSetId) => handleReorder(factorSetId, -1)
          }
          onMoveDown={
            readOnly ? undefined : (factorSetId) => handleReorder(factorSetId, 1)
          }
        />
      </div>

      {attachModal}
    </div>
  );
}
