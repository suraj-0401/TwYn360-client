"use client";

import { useMemo } from "react";
import { resolveLookupFromField } from "@/renderer/lookup-field.metadata";
import type { FieldDefinition } from "@/renderer/types";
import { useWorkspaceDefinition } from "./use-workspace-definition";

/** Map field id → lookup type/collection id from workspace definition only. */
export function useWorkspaceLookupSources(workspaceSlug: string) {
  const { data: definition, isLoading, isError } =
    useWorkspaceDefinition(workspaceSlug);

  const sources = useMemo(() => {
    const map: Record<string, string> = {};
    if (!definition?.fields) {
      return map;
    }

    for (const [fieldId, field] of Object.entries(definition.fields)) {
      const lookup = resolveLookupFromField(field as FieldDefinition);
      if (lookup?.collectionId) {
        map[fieldId] = lookup.collectionId;
      }
    }
    return map;
  }, [definition]);

  return { sources, isLoading, isError, definition };
}
