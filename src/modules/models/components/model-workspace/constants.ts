import type { WorkspaceTabItem } from "@/components/layout/workspace-tabs";

export const MODEL_WORKSPACE_FORM_ID = "model-workspace-form";

export type ModelWorkspaceTabId =
  | "overview"
  | "factor-sets"
  | "factors"
  | "settings"
  | "audit";

export const MODEL_WORKSPACE_TABS: WorkspaceTabItem[] = [
  { id: "overview", label: "Overview" },
  { id: "factor-sets", label: "Factor sets" },
  { id: "factors", label: "Factors" },
  { id: "settings", label: "Settings" },
  { id: "audit", label: "Audit" },
];

export function isModelWorkspaceTabId(value: string): value is ModelWorkspaceTabId {
  return MODEL_WORKSPACE_TABS.some((tab) => tab.id === value);
}
