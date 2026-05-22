import type { QueryClient } from "@tanstack/react-query";
import type { ApiSuccessResponse } from "@/types/api";
import type { WorkspaceDetail } from "@/types/workspace";
import { workspaceDefinitionQueryKey } from "@/renderer/hooks/use-workspace-definition";
import { toast } from "@/lib/toast";

export const workspaceQueryKey = (id: string) => ["workspace", id] as const;

export const workspaceBySlugQueryKey = (slug: string) =>
  ["workspace", "by-slug", slug] as const;

function syncWorkspaceCaches(
  queryClient: QueryClient,
  workspaceId: string,
  detail: WorkspaceDetail,
) {
  queryClient.setQueryData(workspaceQueryKey(workspaceId), detail);

  if (detail.slug) {
    queryClient.setQueryData(workspaceBySlugQueryKey(detail.slug), detail);
    queryClient.setQueryData(
      workspaceDefinitionQueryKey(detail.slug),
      detail.payload,
    );
  }
}

export async function applyWorkspaceMutation(
  queryClient: QueryClient,
  workspaceId: string,
  workspaceSlug: string | undefined,
  request: Promise<ApiSuccessResponse<WorkspaceDetail>>,
  options?: {
    successMessage?: string;
    silent?: boolean;
    optimistic?: (current: WorkspaceDetail) => WorkspaceDetail;
  },
): Promise<WorkspaceDetail | null> {
  const slugKey = workspaceSlug
    ? workspaceBySlugQueryKey(workspaceSlug)
    : null;
  const previous =
    slugKey !== null
      ? queryClient.getQueryData<WorkspaceDetail>(slugKey)
      : queryClient.getQueryData<WorkspaceDetail>(workspaceQueryKey(workspaceId));

  if (options?.optimistic && previous) {
    syncWorkspaceCaches(queryClient, workspaceId, options.optimistic(previous));
  }

  try {
    const response = await request;
    const detail = response.data;
    syncWorkspaceCaches(queryClient, workspaceId, detail);

    if (options?.successMessage && !options.silent) {
      toast.success(options.successMessage);
    }
    return detail;
  } catch (err) {
    if (previous) {
      syncWorkspaceCaches(queryClient, workspaceId, previous);
    }
    toast.error(err instanceof Error ? err.message : "Save failed");
    return null;
  }
}
