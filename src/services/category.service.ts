import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type { EntityRecordDto } from "@/types/entity-record";

export interface CategoryDrugReference {
  id: string;
  displayName: string | null;
  slug: string | null;
  status: string;
  name: string;
  statusCode: string | null;
}

export interface CategoryDrugsResult {
  items: CategoryDrugReference[];
  count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function listCategoryDrugs(
  categoryId: string,
  params?: { page?: number; limit?: number },
): Promise<ApiSuccessResponse<CategoryDrugsResult>> {
  const { data } = await apiClient.get<ApiSuccessResponse<CategoryDrugsResult>>(
    `/api/v1/categories/${categoryId}/drugs`,
    { params, skipGlobalErrorToast: true },
  );
  return data;
}

export async function permanentDeleteCategory(
  categoryId: string,
  payload: { confirmName: string },
): Promise<ApiSuccessResponse<EntityRecordDto>> {
  const { data } = await apiClient.post<ApiSuccessResponse<EntityRecordDto>>(
    `/api/v1/categories/${categoryId}/delete`,
    payload,
  );
  return data;
}
