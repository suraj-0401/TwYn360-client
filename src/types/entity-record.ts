export type EntityRecordDto = {
  id: string;
  entityTypeSlug: string;
  status: string;
  displayName: string | null;
  slug: string | null;
  values: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type EntityRecordListItemDto = {
  id: string;
  entityTypeSlug: string;
  status: string;
  displayName: string | null;
  slug: string | null;
  values: Record<string, unknown>;
  updatedAt: string;
};

export type EntityRecordListResult = {
  items: EntityRecordListItemDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ListEntityRecordsParams = {
  page?: number;
  limit?: number;
  search?: string;
  statusCode?: string;
  categoryId?: string;
  includeArchived?: boolean;
};
