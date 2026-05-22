"use client";

import { useWorkspaceLookupSources } from "@/renderer/hooks/use-workspace-lookup-sources";
import { useFactorRegistryLabels } from "./use-factor-registry-labels";

/** @deprecated Use useFactorRegistryLabels with sources from the page. */
export function useFactorListLabels(workspaceSlug: string) {
  const { sources, definition, isLoading: sourcesLoading } =
    useWorkspaceLookupSources(workspaceSlug);
  const { labelsByFieldId } = useFactorRegistryLabels(sources);

  return {
    fields: definition?.fields,
    definition,
    sources,
    labelsByFieldId,
    isLoading: sourcesLoading,
  };
}
