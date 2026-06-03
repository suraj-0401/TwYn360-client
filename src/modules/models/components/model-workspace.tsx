"use client";

import { useMemo, useState } from "react";
import { WorkspaceContent } from "@/components/layout/workspace-content";
import { WorkspaceTabs } from "@/components/layout/workspace-tabs";
import { EntityAuditPanel } from "@/components/data-table/entity-audit-panel";
import { LIFECYCLE_STATUS } from "@/config/lifecycle";
import type { ModelDto, UpdateModelPayload } from "@/types/model";
import { useVisitedTabs } from "../hooks/use-visited-tabs";
import { ModelFactorSetsSection } from "./model-factor-sets-section";
import { ModelFactorsSection } from "./model-factors-section";
import { ModelFormulaTab } from "./model-formula-tab";
import { ModelRuntimeTab } from "./model-runtime-tab";
import { ModelForm } from "./model-form";
import { ModelSettingsTab } from "./model-settings-tab";
import { ModelWorkspaceTabPanel } from "./model-workspace-tab-panel";
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
  const visitedTabs = useVisitedTabs(activeTab);

  const isArchived = model.statusCode === LIFECYCLE_STATUS.ARCHIVED;
  const graphLocked = isArchived || model.statusCode === LIFECYCLE_STATUS.DELETED;
  const factorSetsReadOnly = readOnly || graphLocked;
  const formReadOnly = readOnly && !isArchived;

  const submitLabel = useMemo(() => {
    if (model.statusCode === "archived") {
      return "Restore to active";
    }
    return "Save";
  }, [model.statusCode]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceTabs
        tabs={[...MODEL_WORKSPACE_TABS]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as ModelWorkspaceTabId)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <WorkspaceContent>
          <ModelWorkspaceTabPanel
            tabId="overview"
            activeId={activeTab}
            visited={visitedTabs}
          >
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
          </ModelWorkspaceTabPanel>

          <ModelWorkspaceTabPanel
            tabId="factor-sets"
            activeId={activeTab}
            visited={visitedTabs}
          >
            <ModelFactorSetsSection
              modelId={model.id}
              factorSets={model.factorSets}
              readOnly={factorSetsReadOnly}
              graphLocked={graphLocked}
              layout="workspace"
            />
          </ModelWorkspaceTabPanel>

          <ModelWorkspaceTabPanel
            tabId="factors"
            activeId={activeTab}
            visited={visitedTabs}
          >
            <ModelFactorsSection
              modelId={model.id}
              readOnly={readOnly || graphLocked}
              graphLocked={graphLocked}
              layout="workspace"
            />
          </ModelWorkspaceTabPanel>

          <ModelWorkspaceTabPanel
            tabId="formula"
            activeId={activeTab}
            visited={visitedTabs}
          >
            <ModelFormulaTab modelId={model.id} readOnly={graphLocked} />
          </ModelWorkspaceTabPanel>

          <ModelWorkspaceTabPanel tabId="run" activeId={activeTab} visited={visitedTabs}>
            <ModelRuntimeTab modelId={model.id} />
          </ModelWorkspaceTabPanel>

          <ModelWorkspaceTabPanel
            tabId="settings"
            activeId={activeTab}
            visited={visitedTabs}
          >
            <ModelSettingsTab model={model} />
          </ModelWorkspaceTabPanel>

          <ModelWorkspaceTabPanel tabId="audit" activeId={activeTab} visited={visitedTabs}>
            <EntityAuditPanel
              entityType="model"
              entityId={model.id}
              variant="platform"
              title="Model activity"
            />
          </ModelWorkspaceTabPanel>
        </WorkspaceContent>
      </div>
    </div>
  );
}
