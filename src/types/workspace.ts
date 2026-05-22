import type { FormDefinitionPayload } from "@/renderer/types";

export interface WorkspaceListItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  version: number;
  updatedAt: string;
}

export interface WorkspaceSectionRecord {
  id: string;
  formId: string;
  key: string;
  title: string;
  description: string | null;
  tooltip: string | null;
  displayOrder: number;
  layoutConfig: {
    columns?: 1 | 2;
    collapsible?: boolean;
    defaultExpanded?: boolean;
    sectionType?: string;
  } | null;
  fields: WorkspaceFieldRecord[];
}

export interface WorkspaceFieldRecord {
  id: string;
  sectionId: string;
  fieldKey: string;
  factorId: string | null;
  fieldType: string | null;
  dataType: string | null;
  config: Record<string, unknown> | null;
  uiConfig: { width?: "full" | "half" } | null;
  validationsOverride: Record<string, unknown> | null;
  labelOverride: string | null;
  placeholder: string | null;
  tooltip: string | null;
  required: boolean;
  displayOrder: number;
  factor?: {
    id: string;
    slug: string;
    displayName: string;
    dataTypeCode: string;
  } | null;
}

export interface WorkspaceDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  version: number;
  sections: WorkspaceSectionRecord[];
  payload: FormDefinitionPayload;
}
