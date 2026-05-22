import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  Factor,
  FactorListParams,
  FactorListResult,
  PermanentDeletePayload,
} from "@/types/factor";

export async function listFactors(
  params: FactorListParams,
): Promise<ApiSuccessResponse<FactorListResult>> {
  const { data } = await apiClient.get<ApiSuccessResponse<FactorListResult>>(
    "/api/v1/factors",
    { params, skipGlobalErrorToast: true },
  );
  return data;
}

export async function getFactor(
  id: string,
): Promise<ApiSuccessResponse<Factor>> {
  const { data } = await apiClient.get<ApiSuccessResponse<Factor>>(
    `/api/v1/factors/${id}`,
  );
  return data;
}

export async function createFactor(
  payload: Record<string, unknown>,
): Promise<ApiSuccessResponse<Factor>> {
  const { data } = await apiClient.post<ApiSuccessResponse<Factor>>(
    "/api/v1/factors",
    payload,
  );
  return data;
}

export async function updateFactor(
  id: string,
  payload: Record<string, unknown>,
): Promise<ApiSuccessResponse<Factor>> {
  const { data } = await apiClient.put<ApiSuccessResponse<Factor>>(
    `/api/v1/factors/${id}`,
    payload,
  );
  return data;
}

export async function archiveFactor(
  id: string,
): Promise<ApiSuccessResponse<Factor>> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Factor>>(
    `/api/v1/factors/${id}/archive`,
  );
  return data;
}

export async function restoreFactor(
  id: string,
): Promise<ApiSuccessResponse<Factor>> {
  const { data } = await apiClient.patch<ApiSuccessResponse<Factor>>(
    `/api/v1/factors/${id}/restore`,
  );
  return data;
}

export async function permanentDeleteFactor(
  id: string,
  payload: PermanentDeletePayload,
): Promise<ApiSuccessResponse<Factor>> {
  const { data } = await apiClient.post<ApiSuccessResponse<Factor>>(
    `/api/v1/factors/${id}/delete`,
    payload,
  );
  return data;
}
