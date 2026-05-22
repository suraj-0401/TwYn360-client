"use client";

import { useQuery } from "@tanstack/react-query";
import { getWorkspaceDefinition } from "@/services/workspace.service";

export const workspaceDefinitionQueryKey = (slug: string) =>
  ["workspace", "definition", slug] as const;

export function useWorkspaceDefinition(workspaceSlug: string) {
  return useQuery({
    queryKey: workspaceDefinitionQueryKey(workspaceSlug),
    queryFn: async () => {
      const response = await getWorkspaceDefinition(workspaceSlug);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
