import { apiClient } from "@/lib/axios";
import { resolveFormulaPayload } from "@/modules/models/utils/resolve-formula-payload";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  FormulaDto,
  FormulaParameterInput,
  FormulaTargetType,
  FormulaVersionDto,
} from "@/types/formula";

type CreateFormulaPayload = {
  modelId: string;
  formulaType: string;
  rawExpression: string;
  aliasMap?: Record<string, string>;
  formulaParameters?: FormulaParameterInput[];
  manualMode?: boolean;
  targetType?: FormulaTargetType;
  targetId?: string;
  formulaKind?: string;
  /** Legacy bridge */
  targetInstanceId?: string;
};

type UpdateFormulaPayload = {
  rawExpression?: string;
  aliasMap?: Record<string, string>;
  formulaParameters?: FormulaParameterInput[];
  manualMode?: boolean;
  expectedVersion?: number;
};

export async function getFormulaByTarget(
  modelId: string,
  targetType: FormulaTargetType,
  targetId: string,
): Promise<FormulaDto | null> {
  const pathByTarget: Record<FormulaTargetType, string> = {
    outcome: `/api/v1/models/${modelId}/outcomes/${targetId}/formula`,
    derived_factor: `/api/v1/models/${modelId}/derived-factors/${targetId}/formula`,
    factor_instance: `/api/v1/models/${modelId}/factor-instances/${targetId}/formula`,
  };

  const { data: envelope } = await apiClient.get<ApiSuccessResponse<unknown>>(
    pathByTarget[targetType],
    { skipGlobalErrorToast: true },
  );
  return resolveFormulaPayload(envelope);
}

/** Legacy helper — factor instance formulas. */
export async function getFormulaByInstance(modelId: string, instanceId: string) {
  return getFormulaByTarget(modelId, "factor_instance", instanceId);
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
