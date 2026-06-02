import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  ClinicalAssessment,
  ClinicalAssessmentSummary,
  CreateClinicalAssessmentPayload,
  UpdateClinicalAssessmentPayload,
} from "@/types/clinical-assessment";

export async function listClinicalAssessments(params?: {
  modelId?: string;
  limit?: number;
}): Promise<ApiSuccessResponse<{ items: ClinicalAssessmentSummary[] }>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<{ items: ClinicalAssessmentSummary[] }>
  >("/api/v1/clinical-assessments", {
    params,
    skipGlobalErrorToast: true,
  });
  return data;
}

export async function getClinicalAssessment(
  assessmentId: string,
): Promise<ApiSuccessResponse<ClinicalAssessment>> {
  const { data } = await apiClient.get<ApiSuccessResponse<ClinicalAssessment>>(
    `/api/v1/clinical-assessments/${assessmentId}`,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function createClinicalAssessment(
  modelId: string,
  payload: CreateClinicalAssessmentPayload = {},
): Promise<ApiSuccessResponse<ClinicalAssessment>> {
  const { data } = await apiClient.post<ApiSuccessResponse<ClinicalAssessment>>(
    `/api/v1/models/${modelId}/clinical-assessments`,
    payload,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function updateClinicalAssessment(
  assessmentId: string,
  payload: UpdateClinicalAssessmentPayload,
): Promise<ApiSuccessResponse<ClinicalAssessment>> {
  const { data } = await apiClient.patch<ApiSuccessResponse<ClinicalAssessment>>(
    `/api/v1/clinical-assessments/${assessmentId}`,
    payload,
    { skipGlobalErrorToast: true },
  );
  return data;
}
