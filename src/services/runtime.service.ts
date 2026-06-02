import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type { RuntimeExecutionResult, RuntimePlan } from "@/types/runtime";

export async function getModelRuntimePlan(
  modelId: string,
): Promise<ApiSuccessResponse<RuntimePlan>> {
  const { data } = await apiClient.get<ApiSuccessResponse<RuntimePlan>>(
    `/api/v1/models/${modelId}/runtime-plan`,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function executeModel(
  modelId: string,
  inputs: Record<string, number>,
): Promise<ApiSuccessResponse<RuntimeExecutionResult>> {
  const { data } = await apiClient.post<ApiSuccessResponse<RuntimeExecutionResult>>(
    `/api/v1/models/${modelId}/execute`,
    { inputs },
    { skipGlobalErrorToast: true },
  );
  return data;
}
