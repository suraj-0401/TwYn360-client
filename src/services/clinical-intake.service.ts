import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type { ClinicalIntakeSchema } from "@/types/clinical-intake";

export async function getClinicalIntakeSchema(
  modelId: string,
): Promise<ApiSuccessResponse<ClinicalIntakeSchema>> {
  const { data } = await apiClient.get<ApiSuccessResponse<ClinicalIntakeSchema>>(
    `/api/v1/models/${modelId}/clinical-intake-schema`,
    { skipGlobalErrorToast: true },
  );
  return data;
}
