import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type { DerivedFactorDefinitionDto } from "@/types/formula";

type CreateDerivedFactorPayload = {
  slug: string;
  displayName: string;
  description?: string;
  unitCode?: string;
};

type UpdateDerivedFactorPayload = {
  displayName?: string;
  description?: string | null;
  unitCode?: string | null;
  expectedVersion?: number;
};

export async function getDerivedFactor(modelId: string, derivedFactorId: string) {
  const { data } = await apiClient.get<ApiSuccessResponse<DerivedFactorDefinitionDto>>(
    `/api/v1/models/${modelId}/derived-factors/${derivedFactorId}`,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function listDerivedFactors(modelId: string) {
  const { data } = await apiClient.get<ApiSuccessResponse<DerivedFactorDefinitionDto[]>>(
    `/api/v1/models/${modelId}/derived-factors`,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function createDerivedFactor(
  modelId: string,
  payload: CreateDerivedFactorPayload,
) {
  const { data } = await apiClient.post<ApiSuccessResponse<DerivedFactorDefinitionDto>>(
    `/api/v1/models/${modelId}/derived-factors`,
    payload,
  );
  return data;
}

export async function updateDerivedFactor(
  modelId: string,
  derivedFactorId: string,
  payload: UpdateDerivedFactorPayload,
) {
  const { data } = await apiClient.patch<ApiSuccessResponse<DerivedFactorDefinitionDto>>(
    `/api/v1/models/${modelId}/derived-factors/${derivedFactorId}`,
    payload,
  );
  return data;
}

export async function deleteDerivedFactor(modelId: string, derivedFactorId: string) {
  const { data } = await apiClient.delete<ApiSuccessResponse<{ deleted: boolean }>>(
    `/api/v1/models/${modelId}/derived-factors/${derivedFactorId}`,
  );
  return data;
}
