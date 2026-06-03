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

export type RuntimeExecuteInputs = Record<
  string,
  string | number | boolean | null
>;

/** Clinical model execution can run multiple simulation evaluations; allow extra time. */
const EXECUTE_TIMEOUT_MS = 120_000;

export async function executeModel(
  modelId: string,
  inputs: RuntimeExecuteInputs,
): Promise<ApiSuccessResponse<RuntimeExecutionResult>> {
  const { data } = await apiClient.post<ApiSuccessResponse<RuntimeExecutionResult>>(
    `/api/v1/models/${modelId}/execute`,
    { inputs },
    { skipGlobalErrorToast: true, timeout: EXECUTE_TIMEOUT_MS },
  );
  return data;
}
