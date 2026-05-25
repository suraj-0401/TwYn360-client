/** Matches `services/dff-service/src/platform/pagination.ts` list responses. */
export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedList<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export const DEFAULT_LIST_LIMIT = 20;
