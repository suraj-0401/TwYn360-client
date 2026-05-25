import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type { ModelFieldConfig } from "@/types/model-config";
import type {
  AddModelFactorSetPayload,
  CreateModelPayload,
  ModelDto,
  ModelListParams,
  ModelListResult,
  ReorderModelFactorSetsPayload,
  UpdateModelPayload,
} from "@/types/model";

export async function getModelFieldConfig(): Promise<
  ApiSuccessResponse<ModelFieldConfig>
> {
  const { data } = await apiClient.get<ApiSuccessResponse<ModelFieldConfig>>(
    "/api/v1/models/config",
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function listModels(
  params: ModelListParams,
): Promise<ApiSuccessResponse<ModelListResult>> {
  const { data } = await apiClient.get<ApiSuccessResponse<ModelListResult>>(
    "/api/v1/models",
    { params, skipGlobalErrorToast: true },
  );
  return data;
}

export async function listModelsForDrug(
  drugId: string,
  params?: Omit<ModelListParams, "drugId">,
): Promise<ApiSuccessResponse<ModelListResult>> {
  const { data } = await apiClient.get<ApiSuccessResponse<ModelListResult>>(
    `/api/v1/drugs/${drugId}/models`,
    { params, skipGlobalErrorToast: true },
  );
  return data;
}

export async function getModel(
  id: string,
): Promise<ApiSuccessResponse<ModelDto>> {
  const { data } = await apiClient.get<ApiSuccessResponse<ModelDto>>(
    `/api/v1/models/${id}`,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function createModel(
  payload: CreateModelPayload,
): Promise<ApiSuccessResponse<ModelDto>> {
  const { data } = await apiClient.post<ApiSuccessResponse<ModelDto>>(
    "/api/v1/models",
    payload,
  );
  return data;
}

export async function updateModel(
  id: string,
  payload: UpdateModelPayload,
): Promise<ApiSuccessResponse<ModelDto>> {
  const { data } = await apiClient.put<ApiSuccessResponse<ModelDto>>(
    `/api/v1/models/${id}`,
    payload,
  );
  return data;
}

export async function archiveModel(
  id: string,
): Promise<ApiSuccessResponse<ModelDto>> {
  const { data } = await apiClient.patch<ApiSuccessResponse<ModelDto>>(
    `/api/v1/models/${id}/archive`,
  );
  return data;
}

export async function permanentDeleteModel(
  id: string,
  payload: { confirmName: string },
): Promise<ApiSuccessResponse<ModelDto>> {
  const { data } = await apiClient.post<ApiSuccessResponse<ModelDto>>(
    `/api/v1/models/${id}/delete`,
    payload,
  );
  return data;
}

export async function addModelFactorSet(
  modelId: string,
  payload: AddModelFactorSetPayload,
): Promise<ApiSuccessResponse<ModelDto>> {
  const { data } = await apiClient.post<ApiSuccessResponse<ModelDto>>(
    `/api/v1/models/${modelId}/factor-sets`,
    payload,
  );
  return data;
}

export async function removeModelFactorSet(
  modelId: string,
  factorSetId: string,
): Promise<ApiSuccessResponse<ModelDto>> {
  const { data } = await apiClient.delete<ApiSuccessResponse<ModelDto>>(
    `/api/v1/models/${modelId}/factor-sets/${factorSetId}`,
  );
  return data;
}

export async function reorderModelFactorSets(
  modelId: string,
  payload: ReorderModelFactorSetsPayload,
): Promise<ApiSuccessResponse<ModelDto>> {
  const { data } = await apiClient.put<ApiSuccessResponse<ModelDto>>(
    `/api/v1/models/${modelId}/factor-sets/reorder`,
    payload,
  );
  return data;
}
