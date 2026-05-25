"use client";

import { WorkspaceContent } from "@/components/layout/workspace-content";
import { FactorSetForm } from "./factor-set-form";
import type { FactorSetFormValues } from "./factor-set-form";
import type { FactorSet } from "@/types/factor-set";
import { FACTOR_SET_WORKSPACE_FORM_ID } from "./factor-set-workspace/constants";

type FactorSetWorkspaceProps = {
  factorSet: FactorSet;
  readOnly: boolean;
  builderMode: boolean;
  adminKey?: string;
  onSubmit: (payload: FactorSetFormValues) => Promise<void>;
  onSavingChange?: (saving: boolean) => void;
};

export function FactorSetWorkspace({
  factorSet,
  readOnly,
  builderMode,
  adminKey,
  onSubmit,
  onSavingChange,
}: FactorSetWorkspaceProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <WorkspaceContent>
        <FactorSetForm
          initial={factorSet}
          submitLabel="Save"
          onSubmit={onSubmit}
          readOnly={readOnly && !builderMode}
          adminKey={adminKey}
          editable={builderMode}
          formId={FACTOR_SET_WORKSPACE_FORM_ID}
          hideSubmitButton
          layout="workspace"
          onSavingChange={onSavingChange}
        />
      </WorkspaceContent>
    </div>
  );
}
