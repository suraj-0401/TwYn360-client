import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type { LookupCollectionOverview } from "@/types/lookup-overview";

export type LookupCollection = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  category: string;
  isSystem: boolean;
  createdAt: string;
};

export type LookupCollectionValue = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  displayOrder: number;
  isSystem: boolean;
  metadata: unknown;
};

export type UpdateLookupCollectionValuePayload = {
  label?: string;
  description?: string | null;
  displayOrder?: number;
};

export type CreateLookupCollectionPayload = {
  label: string;
  code?: string;
  description?: string;
};

export type CreateLookupCollectionValuePayload = {
  code: string;
  label: string;
  description?: string;
};

export async function listLookupCollections(): Promise<
  ApiSuccessResponse<LookupCollection[]>
> {
  const { data } = await apiClient.get<ApiSuccessResponse<LookupCollection[]>>(
    "/api/v1/lookup-collections",
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function listLookupCollectionsOverview(): Promise<
  ApiSuccessResponse<LookupCollectionOverview[]>
> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<LookupCollectionOverview[]>
  >("/api/v1/lookup-collections/overview", { skipGlobalErrorToast: true });
  return data;
}

export async function getLookupCollectionOverviewByCode(
  code: string,
): Promise<ApiSuccessResponse<LookupCollectionOverview | null>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<LookupCollectionOverview | null>
  >(
    `/api/v1/lookup-collections/by-code/${encodeURIComponent(code)}/overview`,
    { skipGlobalErrorToast: true },
  );
  return data;
}

export async function deleteLookupCollection(
  collectionId: string,
  adminKey?: string,
): Promise<ApiSuccessResponse<{ id: string }>> {
  const { data } = await apiClient.delete<ApiSuccessResponse<{ id: string }>>(
    `/api/v1/lookup-collections/${collectionId}`,
    {
      headers: adminKey ? { "x-admin-key": adminKey } : undefined,
      skipGlobalErrorToast: true,
    },
  );
  return data;
}

export async function createLookupCollection(
  payload: CreateLookupCollectionPayload,
  adminKey?: string,
): Promise<ApiSuccessResponse<LookupCollection>> {
  const { data } = await apiClient.post<ApiSuccessResponse<LookupCollection>>(
    "/api/v1/lookup-collections",
    payload,
    {
      headers: adminKey ? { "x-admin-key": adminKey } : undefined,
      skipGlobalErrorToast: true,
    },
  );
  return data;
}

export async function listCollectionValues(
  collectionId: string,
): Promise<ApiSuccessResponse<LookupCollectionValue[]>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<LookupCollectionValue[]>
  >(`/api/v1/lookup-collections/${collectionId}/values`, {
    skipGlobalErrorToast: true,
  });
  return data;
}

export async function listCollectionValuesByCode(
  code: string,
): Promise<ApiSuccessResponse<LookupCollectionValue[]>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<LookupCollectionValue[]>
  >(`/api/v1/lookup-collections/by-code/${encodeURIComponent(code)}/values`, {
    skipGlobalErrorToast: true,
  });
  return data;
}

export async function createCollectionValueByCode(
  code: string,
  payload: CreateLookupCollectionValuePayload,
  adminKey?: string,
): Promise<ApiSuccessResponse<unknown>> {
  const { data } = await apiClient.post<ApiSuccessResponse<unknown>>(
    `/api/v1/lookup-collections/by-code/${encodeURIComponent(code)}/values`,
    payload,
    {
      headers: adminKey ? { "x-admin-key": adminKey } : undefined,
      skipGlobalErrorToast: true,
    },
  );
  return data;
}

export async function archiveCollectionValue(
  valueId: string,
  adminKey?: string,
): Promise<ApiSuccessResponse<unknown>> {
  const { data } = await apiClient.patch<ApiSuccessResponse<unknown>>(
    `/api/v1/admin/lookup-values/${valueId}/archive`,
    {},
    {
      headers: adminKey ? { "x-admin-key": adminKey } : undefined,
      skipGlobalErrorToast: true,
    },
  );
  return data;
}

export async function updateCollectionValue(
  valueId: string,
  payload: UpdateLookupCollectionValuePayload,
  adminKey?: string,
): Promise<ApiSuccessResponse<unknown>> {
  const { data } = await apiClient.put<ApiSuccessResponse<unknown>>(
    `/api/v1/lookup-values/${valueId}`,
    payload,
    {
      headers: adminKey ? { "x-admin-key": adminKey } : undefined,
      skipGlobalErrorToast: true,
    },
  );
  return data;
}

export async function deleteCollectionValue(
  valueId: string,
  adminKey?: string,
): Promise<ApiSuccessResponse<{ id: string }>> {
  const { data } = await apiClient.delete<ApiSuccessResponse<{ id: string }>>(
    `/api/v1/lookup-values/${valueId}`,
    {
      headers: adminKey ? { "x-admin-key": adminKey } : undefined,
      skipGlobalErrorToast: true,
    },
  );
  return data;
}

export async function createCollectionValue(
  collectionId: string,
  payload: CreateLookupCollectionValuePayload,
  adminKey?: string,
): Promise<ApiSuccessResponse<unknown>> {
  const { data } = await apiClient.post<ApiSuccessResponse<unknown>>(
    `/api/v1/lookup-collections/${collectionId}/values`,
    payload,
    {
      headers: adminKey ? { "x-admin-key": adminKey } : undefined,
      skipGlobalErrorToast: true,
    },
  );
  return data;
}
