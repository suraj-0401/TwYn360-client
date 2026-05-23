"use client";

import { useState } from "react";
import { WorkspaceRenderer } from "@/renderer/components/workspace-renderer";

type EntityFormLayoutEditorProps = {
  workspaceSlug: string;
  adminKey?: string;
};

/**
 * Layout-only workspace builder (no record save). Used on /categories/form and /drugs/form.
 */
export function EntityFormLayoutEditor({
  workspaceSlug,
  adminKey,
}: EntityFormLayoutEditorProps) {
  const [values] = useState<Record<string, unknown>>({});

  return (
    <WorkspaceRenderer
      workspaceSlug={workspaceSlug}
      editable
      values={values}
      onFieldChange={() => {}}
      adminKey={adminKey}
    />
  );
}
