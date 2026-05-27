import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  ModelFactorInstance,
  ResolvedModelFactorInstance,
  UpdateModelFactorInstancePayload,
} from "@/types/model-factor-instance";

export async function listModelFactorInstances(
  modelId: string,
  params?: { resolved?: boolean },
): Promise<ApiSuccessResponse<ModelFactorInstance[] | ResolvedModelFactorInstance[]>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<ModelFactorInstance[] | ResolvedModelFactorInstance[]>
  >(`/api/v1/models/${modelId}/factor-instances`, {
    params,
    skipGlobalErrorToast: true,
  });
  return data;
}

export async function getModelFactorInstance(
  modelId: string,
  instanceId: string,
  params?: { resolved?: boolean },
): Promise<ApiSuccessResponse<ModelFactorInstance | ResolvedModelFactorInstance>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<ModelFactorInstance | ResolvedModelFactorInstance>
  >(`/api/v1/models/${modelId}/factor-instances/${instanceId}`, {
    params,
    skipGlobalErrorToast: true,
  });
  return data;
}

export async function updateModelFactorInstance(
  modelId: string,
  instanceId: string,
  payload: UpdateModelFactorInstancePayload,
): Promise<ApiSuccessResponse<ModelFactorInstance>> {
  const { data } = await apiClient.patch<ApiSuccessResponse<ModelFactorInstance>>(
    `/api/v1/models/${modelId}/factor-instances/${instanceId}`,
    payload,
  );
  return data;
}
