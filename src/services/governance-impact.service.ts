import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  FactorSetMemberRemoveImpact,
  FactorSetUsageImpact,
  FactorUsageImpact,
  ModelDetachImpact,
} from "@/types/governance-impact";

export async function getFactorUsageImpact(
  factorId: string,
): Promise<ApiSuccessResponse<FactorUsageImpact>> {
  const { data } = await apiClient.get<ApiSuccessResponse<FactorUsageImpact>>(
    `/api/v1/factors/${factorId}/usage`,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function getFactorSetUsageImpact(
  factorSetId: string,
): Promise<ApiSuccessResponse<FactorSetUsageImpact>> {
  const { data } = await apiClient.get<ApiSuccessResponse<FactorSetUsageImpact>>(
    `/api/v1/factor-sets/${factorSetId}/usage`,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function getFactorSetMemberRemoveImpact(
  factorSetId: string,
  factorId: string,
): Promise<ApiSuccessResponse<FactorSetMemberRemoveImpact>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<FactorSetMemberRemoveImpact>
  >(
    `/api/v1/factor-sets/${factorSetId}/members/${factorId}/usage`,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function getModelDetachImpact(
  modelId: string,
  factorSetId: string,
): Promise<ApiSuccessResponse<ModelDetachImpact>> {
  const { data } = await apiClient.get<ApiSuccessResponse<ModelDetachImpact>>(
    `/api/v1/models/${modelId}/factor-sets/${factorSetId}/detach-impact`,
    { skipGlobalErrorToast: true },
  );
  return data;
}
