import { apiClient } from "@/lib/axios";
import type { ApiSuccessResponse } from "@/types/api";
import type { PaginatedList } from "@/platform/pagination";

export type AuditLogDto = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  summary: string | null;
  changes: unknown;
  metadata: unknown;
  createdAt: string;
};

export type ListAuditLogsQuery = {
  page?: number;
  limit?: number;
  entityType?: string;
  entityId?: string;
  actor?: string;
};

export async function listAuditLogs(
  query: ListAuditLogsQuery = {},
): Promise<ApiSuccessResponse<PaginatedList<AuditLogDto>>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PaginatedList<AuditLogDto>>
  >("/api/v1/audit-logs", {
    params: query,
    skipGlobalErrorToast: true,
  });
  return data;
}
