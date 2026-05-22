import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type { FormDefinitionPayload } from "@/renderer/types";
import type { WorkspaceDetail } from "@/types/workspace";

function adminHeaders(adminKey?: string) {
  return adminKey ? { "x-admin-key": adminKey } : undefined;
}

export async function getWorkspaceBySlug(
  slug: string,
): Promise<ApiSuccessResponse<WorkspaceDetail>> {
  const { data } = await apiClient.get<ApiSuccessResponse<WorkspaceDetail>>(
    `/api/v1/workspaces/by-slug/${slug}`,
  );
  return data;
}

export async function getWorkspaceDefinition(
  slug: string,
): Promise<ApiSuccessResponse<FormDefinitionPayload>> {
  const { data } = await apiClient.get<ApiSuccessResponse<FormDefinitionPayload>>(
    `/api/v1/renderer/workspaces/${slug}`,
  );
  return data;
}

export async function publishWorkspace(
  id: string,
  adminKey?: string,
): Promise<ApiSuccessResponse<WorkspaceDetail>> {
  const { data } = await apiClient.post<ApiSuccessResponse<WorkspaceDetail>>(
    `/api/v1/admin/workspaces/${id}/publish`,
    {},
    { headers: adminHeaders(adminKey) },
  );
  return data;
}

export async function addSection(
  workspaceId: string,
  input: { title: string; tooltip?: string; insertAfterIndex?: number },
  adminKey?: string,
): Promise<ApiSuccessResponse<WorkspaceDetail>> {
  const { data } = await apiClient.post<ApiSuccessResponse<WorkspaceDetail>>(
    `/api/v1/admin/workspaces/${workspaceId}/sections`,
    input,
    { headers: adminHeaders(adminKey) },
  );
  return data;
}

export async function duplicateSection(
  sectionId: string,
  adminKey?: string,
): Promise<ApiSuccessResponse<WorkspaceDetail>> {
  const { data } = await apiClient.post<ApiSuccessResponse<WorkspaceDetail>>(
    `/api/v1/admin/workspaces/sections/${sectionId}/duplicate`,
    {},
    { headers: adminHeaders(adminKey) },
  );
  return data;
}

export async function updateSection(
  sectionId: string,
  patch: {
    title?: string;
    description?: string | null;
    tooltip?: string | null;
    layoutConfig?: Record<string, unknown>;
  },
  adminKey?: string,
): Promise<ApiSuccessResponse<WorkspaceDetail>> {
  const { data } = await apiClient.patch<ApiSuccessResponse<WorkspaceDetail>>(
    `/api/v1/admin/workspaces/sections/${sectionId}`,
    patch,
    { headers: adminHeaders(adminKey) },
  );
  return data;
}

export async function deleteSection(
  sectionId: string,
  adminKey?: string,
): Promise<ApiSuccessResponse<WorkspaceDetail>> {
  const { data } = await apiClient.delete<ApiSuccessResponse<WorkspaceDetail>>(
    `/api/v1/admin/workspaces/sections/${sectionId}`,
    { headers: adminHeaders(adminKey) },
  );
  return data;
}

export async function reorderSections(
  workspaceId: string,
  orderedSectionIds: string[],
  adminKey?: string,
): Promise<ApiSuccessResponse<WorkspaceDetail>> {
  const { data } = await apiClient.put<ApiSuccessResponse<WorkspaceDetail>>(
    `/api/v1/admin/workspaces/${workspaceId}/sections/reorder`,
    { orderedSectionIds },
    { headers: adminHeaders(adminKey) },
  );
  return data;
}

export async function addPrimitiveField(
  sectionId: string,
  input: {
    fieldKey: string;
    fieldType: string;
    label: string;
  },
  adminKey?: string,
): Promise<ApiSuccessResponse<WorkspaceDetail>> {
  const { data } = await apiClient.post<ApiSuccessResponse<WorkspaceDetail>>(
    `/api/v1/admin/workspaces/sections/${sectionId}/fields`,
    input,
    { headers: adminHeaders(adminKey) },
  );
  return data;
}

export async function updateField(
  fieldId: string,
  patch: {
    labelOverride?: string;
    placeholder?: string;
    tooltip?: string;
    required?: boolean;
    fieldType?: string;
    dataType?: string;
    config?: Record<string, unknown>;
    validationsOverride?: Record<string, unknown>;
    uiConfig?: { width?: "full" | "half" };
  },
  adminKey?: string,
): Promise<ApiSuccessResponse<WorkspaceDetail>> {
  const { data } = await apiClient.patch<ApiSuccessResponse<WorkspaceDetail>>(
    `/api/v1/admin/workspaces/fields/${fieldId}`,
    patch,
    { headers: adminHeaders(adminKey) },
  );
  return data;
}

export async function deleteField(
  fieldId: string,
  adminKey?: string,
): Promise<ApiSuccessResponse<WorkspaceDetail>> {
  const { data } = await apiClient.delete<ApiSuccessResponse<WorkspaceDetail>>(
    `/api/v1/admin/workspaces/fields/${fieldId}`,
    { headers: adminHeaders(adminKey) },
  );
  return data;
}

export async function reorderFields(
  sectionId: string,
  orderedFieldIds: string[],
  adminKey?: string,
): Promise<ApiSuccessResponse<WorkspaceDetail>> {
  const { data } = await apiClient.put<ApiSuccessResponse<WorkspaceDetail>>(
    `/api/v1/admin/workspaces/sections/${sectionId}/fields/reorder`,
    { orderedFieldIds },
    { headers: adminHeaders(adminKey) },
  );
  return data;
}

