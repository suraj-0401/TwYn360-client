import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  CreateLookupValuePayload,
  LookupValue,
} from "@/types/lookup";

/** Legacy lookup type-code API (prefer lookup-collections UUID). */

export async function getLookupValues(
  typeCode: string,
): Promise<ApiSuccessResponse<LookupValue[]>> {
  const { data } = await apiClient.get<ApiSuccessResponse<LookupValue[]>>(
    `/api/v1/lookups/${typeCode}`,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function archiveLookupValue(
  typeCode: string,
  code: string,
  adminKey?: string,
): Promise<ApiSuccessResponse<unknown>> {
  const { data } = await apiClient.patch<ApiSuccessResponse<unknown>>(
    `/api/v1/admin/lookups/${typeCode}/${code}/archive`,
    {},
    {
      headers: adminKey ? { "x-admin-key": adminKey } : undefined,
      skipGlobalErrorToast: true,
    },
  );
  return data;
}

export async function createLookupValue(
  typeCode: string,
  payload: CreateLookupValuePayload,
  adminKey?: string,
): Promise<ApiSuccessResponse<unknown>> {
  const { data } = await apiClient.post<ApiSuccessResponse<unknown>>(
    `/api/v1/admin/lookups/${typeCode}`,
    payload,
    {
      headers: adminKey ? { "x-admin-key": adminKey } : undefined,
      skipGlobalErrorToast: true,
    },
  );
  return data;
}
