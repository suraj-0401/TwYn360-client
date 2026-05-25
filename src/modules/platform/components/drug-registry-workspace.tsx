"use client";

import { useState } from "react";
import { WorkspaceContent } from "@/components/layout/workspace-content";
import { WorkspaceTabs } from "@/components/layout/workspace-tabs";
import { DrugModelsCard } from "@/modules/models/components/drug-models-card";
import { EntityRecordForm } from "@/modules/platform/components/entity-record-form";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import type { EntityRecordDto } from "@/types/entity-record";

const DRUG_WORKSPACE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "models", label: "Models" },
] as const;

type DrugRegistryWorkspaceProps = {
  drug: EntityRecordDto;
  drugId: string;
  builderMode: boolean;
  adminKey?: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
};

export function DrugRegistryWorkspace({
  drug,
  drugId,
  builderMode,
  adminKey,
  onSubmit,
}: DrugRegistryWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "models">("overview");

  const tabs = builderMode
    ? DRUG_WORKSPACE_TABS.filter((tab) => tab.id === "overview")
    : [...DRUG_WORKSPACE_TABS];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceTabs
        tabs={tabs}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as "overview" | "models")}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <WorkspaceContent>
          {activeTab === "overview" ? (
            <EntityRecordForm
              workspaceSlug={WORKSPACE_SLUGS.DRUG_FORM}
              initial={drug}
              submitLabel="Save changes"
              onSubmit={onSubmit}
              showCategoryPicker={!builderMode}
              adminKey={adminKey}
              editable={builderMode}
            />
          ) : null}

          {activeTab === "models" && !builderMode ? (
            <DrugModelsCard drugId={drugId} />
          ) : null}
        </WorkspaceContent>
      </div>
    </div>
  );
}
