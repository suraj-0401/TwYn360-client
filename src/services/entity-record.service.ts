import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  EntityRecordDto,
  EntityRecordListResult,
  ListEntityRecordsParams,
} from "@/types/entity-record";
import type { EntityTypeSlug } from "@/config/platform";

export async function listEntityRecords(
  typeSlug: EntityTypeSlug,
  params?: ListEntityRecordsParams,
): Promise<ApiSuccessResponse<EntityRecordListResult>> {
  const { data } = await apiClient.get<ApiSuccessResponse<EntityRecordListResult>>(
    `/api/v1/records/${typeSlug}`,
    { params, skipGlobalErrorToast: true },
  );
  return data;
}

export async function getEntityRecord(
  typeSlug: EntityTypeSlug,
  id: string,
): Promise<ApiSuccessResponse<EntityRecordDto>> {
  const { data } = await apiClient.get<ApiSuccessResponse<EntityRecordDto>>(
    `/api/v1/records/${typeSlug}/${id}`,
  );
  return data;
}

export async function createEntityRecord(
  typeSlug: EntityTypeSlug,
  payload: Record<string, unknown>,
): Promise<ApiSuccessResponse<EntityRecordDto>> {
  const { data } = await apiClient.post<ApiSuccessResponse<EntityRecordDto>>(
    `/api/v1/records/${typeSlug}`,
    payload,
  );
  return data;
}

export async function updateEntityRecord(
  typeSlug: EntityTypeSlug,
  id: string,
  payload: Record<string, unknown>,
): Promise<ApiSuccessResponse<EntityRecordDto>> {
  const { data } = await apiClient.put<ApiSuccessResponse<EntityRecordDto>>(
    `/api/v1/records/${typeSlug}/${id}`,
    payload,
  );
  return data;
}

export async function archiveEntityRecord(
  typeSlug: EntityTypeSlug,
  id: string,
): Promise<ApiSuccessResponse<EntityRecordDto>> {
  const { data } = await apiClient.patch<ApiSuccessResponse<EntityRecordDto>>(
    `/api/v1/records/${typeSlug}/${id}/archive`,
  );
  return data;
}
