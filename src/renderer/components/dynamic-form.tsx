"use client";

import { WorkspaceRenderer, type WorkspaceRendererProps } from "./workspace-renderer";

/** @deprecated Use WorkspaceRenderer */
export type DynamicFormProps = WorkspaceRendererProps;

/** @deprecated Use WorkspaceRenderer */
export function DynamicForm(props: DynamicFormProps) {
  return <WorkspaceRenderer {...props} editable={false} />;
}
