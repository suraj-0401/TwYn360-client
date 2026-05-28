import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type { FormulaDto, FormulaVersionDto } from "@/types/formula";

type CreateFormulaPayload = {
  targetInstanceId: string;
  modelId: string;
  formulaType: string;
  framework: string;
  rawExpression: string;
  aliasMap?: Record<string, string>;
  manualMode?: boolean;
};

type UpdateFormulaPayload = {
  rawExpression?: string;
  aliasMap?: Record<string, string>;
  manualMode?: boolean;
  expectedVersion?: number;
};

export async function getFormulaByInstance(modelId: string, instanceId: string) {
  const { data } = await apiClient.get<ApiSuccessResponse<FormulaDto>>(
    `/api/v1/models/${modelId}/factor-instances/${instanceId}/formula`,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function createFormula(modelId: string, payload: CreateFormulaPayload) {
  const { data } = await apiClient.post<ApiSuccessResponse<FormulaDto>>(
    `/api/v1/models/${modelId}/formulas`,
    payload,
  );
  return data;
}

export async function updateFormula(formulaId: string, payload: UpdateFormulaPayload) {
  const { data } = await apiClient.patch<ApiSuccessResponse<FormulaDto>>(
    `/api/v1/formulas/${formulaId}`,
    payload,
  );
  return data;
}

export async function submitFormulaForReview(
  formulaId: string,
  payload?: { expectedVersion?: number; changeNote?: string },
) {
  const { data } = await apiClient.post<ApiSuccessResponse<unknown>>(
    `/api/v1/formulas/${formulaId}/submit-for-review`,
    payload ?? {},
  );
  return data;
}

export async function listFormulaVersions(formulaId: string) {
  const { data } = await apiClient.get<ApiSuccessResponse<FormulaVersionDto[]>>(
    `/api/v1/formulas/${formulaId}/versions`,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function approveFormula(
  formulaId: string,
  payload?: { comment?: string },
) {
  const { data } = await apiClient.post<ApiSuccessResponse<unknown>>(
    `/api/v1/formulas/${formulaId}/approve`,
    payload ?? {},
  );
  return data;
}

export async function rejectFormula(formulaId: string, payload: { comment: string }) {
  const { data } = await apiClient.post<ApiSuccessResponse<unknown>>(
    `/api/v1/formulas/${formulaId}/reject`,
    payload,
  );
  return data;
}
