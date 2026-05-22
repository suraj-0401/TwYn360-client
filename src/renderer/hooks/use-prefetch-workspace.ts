"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { workspaceBySlugQueryKey } from "@/modules/metadata-builder/utils/workspace-builder-actions";
import { workspaceDefinitionQueryKey } from "@/renderer/hooks/use-workspace-definition";
import { getWorkspaceBySlug } from "@/services/workspace.service";
import type { WorkspaceDetail } from "@/types/workspace";

/** Warm workspace cache so View ↔ Edit layout toggles stay instant. */
export function usePrefetchWorkspace(workspaceSlug: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: workspaceBySlugQueryKey(workspaceSlug),
      queryFn: async () => {
        const res = await getWorkspaceBySlug(workspaceSlug);
        return res.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient, workspaceSlug]);

  useEffect(() => {
    const detail = queryClient.getQueryData<WorkspaceDetail>(
      workspaceBySlugQueryKey(workspaceSlug),
    );
    if (detail?.payload) {
      queryClient.setQueryData(
        workspaceDefinitionQueryKey(workspaceSlug),
        detail.payload,
      );
    }
  }, [queryClient, workspaceSlug]);
}
