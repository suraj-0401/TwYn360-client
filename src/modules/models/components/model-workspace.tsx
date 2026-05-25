"use client";

import { useMemo, useState } from "react";
import { WorkspaceContent } from "@/components/layout/workspace-content";
import { WorkspaceTabs } from "@/components/layout/workspace-tabs";
import { EntityAuditPanel } from "@/components/data-table/entity-audit-panel";
import { LIFECYCLE_STATUS } from "@/config/lifecycle";
import type { ModelDto, UpdateModelPayload } from "@/types/model";
import { useModelFactorSets } from "../hooks/use-model-factor-sets";
import { ModelFactorSetsSection } from "./model-factor-sets-section";
import { ModelForm } from "./model-form";
import { ModelSettingsTab } from "./model-settings-tab";
import {
  MODEL_WORKSPACE_FORM_ID,
  MODEL_WORKSPACE_TABS,
  type ModelWorkspaceTabId,
} from "./model-workspace/constants";

type ModelWorkspaceProps = {
  model: ModelDto;
  readOnly: boolean;
  onSubmit: (payload: UpdateModelPayload) => Promise<void>;
  onSavingChange?: (saving: boolean) => void;
};

export function ModelWorkspace({
  model,
  readOnly,
  onSubmit,
  onSavingChange,
}: ModelWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ModelWorkspaceTabId>("overview");
  const factorSets = useModelFactorSets(model.id, model.factorSets);

  const isArchived = model.statusCode === LIFECYCLE_STATUS.ARCHIVED;
  const graphLocked = model.statusCode !== LIFECYCLE_STATUS.DRAFT;
  const factorSetsReadOnly = readOnly || graphLocked;
  const formReadOnly = readOnly && !isArchived;

  const submitLabel = useMemo(() => {
    if (model.statusCode === "archived") {
      return "Restore to active";
    }
    return "Save";
  }, [model.statusCode]);

  function handleRemoveFactorSet(factorSetId: string) {
    if (
      !window.confirm(
        "Remove this factor set from the model? The global factor set is not deleted.",
      )
    ) {
      return;
    }
    factorSets.handleRemove(factorSetId);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceTabs
        tabs={[...MODEL_WORKSPACE_TABS]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as ModelWorkspaceTabId)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <WorkspaceContent>
          {activeTab === "overview" ? (
            <ModelForm
              mode="edit"
              layout="workspace"
              formId={MODEL_WORKSPACE_FORM_ID}
              hideSubmitButton={formReadOnly}
              initial={model}
              submitLabel={submitLabel}
              readOnly={formReadOnly}
              onSubmit={onSubmit}
              onSavingChange={onSavingChange}
            />
          ) : null}

          {activeTab === "factor-sets" ? (
            <ModelFactorSetsSection
              modelId={model.id}
              factorSets={model.factorSets}
              readOnly={factorSetsReadOnly}
              graphLocked={graphLocked}
              layout="workspace"
              actions={factorSets}
              onRemove={handleRemoveFactorSet}
            />
          ) : null}

          {activeTab === "settings" ? <ModelSettingsTab model={model} /> : null}

          {activeTab === "audit" ? (
            <EntityAuditPanel
              entityType="model"
              entityId={model.id}
              variant="platform"
              title="Model activity"
            />
          ) : null}
        </WorkspaceContent>
      </div>
    </div>
  );
}
