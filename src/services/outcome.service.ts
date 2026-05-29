import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type { OutcomeDefinitionDto } from "@/types/formula";

type CreateOutcomePayload = {
  slug: string;
  displayName: string;
  description?: string;
  unitCode?: string;
};

type UpdateOutcomePayload = {
  displayName?: string;
  description?: string | null;
  unitCode?: string | null;
  expectedVersion?: number;
};

export async function getOutcome(modelId: string, outcomeId: string) {
  const { data } = await apiClient.get<ApiSuccessResponse<OutcomeDefinitionDto>>(
    `/api/v1/models/${modelId}/outcomes/${outcomeId}`,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function listOutcomes(modelId: string) {
  const { data } = await apiClient.get<ApiSuccessResponse<OutcomeDefinitionDto[]>>(
    `/api/v1/models/${modelId}/outcomes`,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function createOutcome(modelId: string, payload: CreateOutcomePayload) {
  const { data } = await apiClient.post<ApiSuccessResponse<OutcomeDefinitionDto>>(
    `/api/v1/models/${modelId}/outcomes`,
    payload,
  );
  return data;
}

export async function updateOutcome(
  modelId: string,
  outcomeId: string,
  payload: UpdateOutcomePayload,
) {
  const { data } = await apiClient.patch<ApiSuccessResponse<OutcomeDefinitionDto>>(
    `/api/v1/models/${modelId}/outcomes/${outcomeId}`,
    payload,
  );
  return data;
}

export async function deleteOutcome(modelId: string, outcomeId: string) {
  const { data } = await apiClient.delete<ApiSuccessResponse<{ deleted: boolean }>>(
    `/api/v1/models/${modelId}/outcomes/${outcomeId}`,
  );
  return data;
}
