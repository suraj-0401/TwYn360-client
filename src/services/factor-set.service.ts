import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  AddFactorSetMemberPayload,
  CreateFactorSetPayload,
  FactorSet,
  FactorSetListParams,
  FactorSetListResult,
  FactorSetReference,
  ReorderFactorSetMembersPayload,
  ReplaceFactorSetMembersPayload,
  UpdateFactorSetPayload,
} from "@/types/factor-set";

export async function listFactorSets(
  params: FactorSetListParams,
): Promise<ApiSuccessResponse<FactorSetListResult>> {
  const { data } = await apiClient.get<ApiSuccessResponse<FactorSetListResult>>(
    "/api/v1/factor-sets",
    { params, skipGlobalErrorToast: true },
  );
  return data;
}

export async function getFactorSet(
  id: string,
): Promise<ApiSuccessResponse<FactorSet>> {
  const { data } = await apiClient.get<ApiSuccessResponse<FactorSet>>(
    `/api/v1/factor-sets/${id}`,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function createFactorSet(
  payload: CreateFactorSetPayload | Record<string, unknown>,
): Promise<ApiSuccessResponse<FactorSet>> {
  const { data } = await apiClient.post<ApiSuccessResponse<FactorSet>>(
    "/api/v1/factor-sets",
    payload,
  );
  return data;
}

export async function updateFactorSet(
  id: string,
  payload: UpdateFactorSetPayload | Record<string, unknown>,
): Promise<ApiSuccessResponse<FactorSet>> {
  const { data } = await apiClient.put<ApiSuccessResponse<FactorSet>>(
    `/api/v1/factor-sets/${id}`,
    payload,
  );
  return data;
}

export async function archiveFactorSet(
  id: string,
): Promise<ApiSuccessResponse<FactorSet>> {
  const { data } = await apiClient.patch<ApiSuccessResponse<FactorSet>>(
    `/api/v1/factor-sets/${id}/archive`,
  );
  return data;
}

export async function addFactorSetMember(
  factorSetId: string,
  payload: AddFactorSetMemberPayload,
): Promise<ApiSuccessResponse<FactorSet>> {
  const { data } = await apiClient.post<ApiSuccessResponse<FactorSet>>(
    `/api/v1/factor-sets/${factorSetId}/members`,
    payload,
  );
  return data;
}

export async function removeFactorSetMember(
  factorSetId: string,
  factorId: string,
): Promise<ApiSuccessResponse<FactorSet>> {
  const { data } = await apiClient.delete<ApiSuccessResponse<FactorSet>>(
    `/api/v1/factor-sets/${factorSetId}/members/${factorId}`,
  );
  return data;
}

export async function reorderFactorSetMembers(
  factorSetId: string,
  payload: ReorderFactorSetMembersPayload,
): Promise<ApiSuccessResponse<FactorSet>> {
  const { data } = await apiClient.put<ApiSuccessResponse<FactorSet>>(
    `/api/v1/factor-sets/${factorSetId}/members/reorder`,
    payload,
  );
  return data;
}

export async function replaceFactorSetMembers(
  factorSetId: string,
  payload: ReplaceFactorSetMembersPayload,
): Promise<ApiSuccessResponse<FactorSet>> {
  const { data } = await apiClient.put<ApiSuccessResponse<FactorSet>>(
    `/api/v1/factor-sets/${factorSetId}/members`,
    payload,
  );
  return data;
}

export async function listFactorSetsForFactor(
  factorId: string,
): Promise<ApiSuccessResponse<{ items: FactorSetReference[] }>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ items: FactorSetReference[] }>
  >(`/api/v1/factors/${factorId}/factor-sets`, { skipGlobalErrorToast: true });
  return data;
}
