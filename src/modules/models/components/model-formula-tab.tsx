"use client";

import { ModelOutcomesPanel } from "./model-outcomes-panel";

type ModelFormulaTabProps = {
  modelId: string;
  readOnly?: boolean;
};

export function ModelFormulaTab({ modelId, readOnly = false }: ModelFormulaTabProps) {
  return (
    <ModelOutcomesPanel
      modelId={modelId}
      readOnly={readOnly}
      layout="workspace"
    />
  );
}
