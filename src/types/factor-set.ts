export interface FactorSetListItem {
  id: string;
  name: string;
  slug: string;
  displayName: string;
  description: string | null;
  statusCode: string;
  version: number;
  memberCount: number;
  updatedAt: string;
}

export interface FactorSummary {
  id: string;
  name: string;
  slug: string;
  displayName: string;
  categoryCode: string;
  dataTypeCode: string;
  statusCode: string;
  unitCode: string | null;
}

export interface FactorSetCustomField {
  id: string;
  key: string;
  label: string;
  value: unknown;
  dataType: string;
  createdAt: string;
}

export interface FactorSetMember {
  id: string;
  factorId: string;
  displayOrder: number;
  factor: FactorSummary;
}

export interface FactorSet {
  id: string;
  name: string;
  slug: string;
  displayName: string;
  description: string | null;
  statusCode: string;
  tags: unknown;
  version: number;
  memberCount: number;
  members: FactorSetMember[];
  customFields: FactorSetCustomField[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface FactorSetListParams {
  page?: number;
  limit?: number;
  search?: string;
  statusCode?: string;
  includeArchived?: boolean;
}

export interface FactorSetListResult {
  items: FactorSetListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FactorSetReference {
  id: string;
  name: string;
  slug: string;
  displayName: string;
  statusCode: string;
}

export interface FactorSetCustomFieldInput {
  key: string;
  label: string;
  value?: unknown;
  dataType: string;
}

export interface FactorSetPayload {
  name: string;
  displayName: string;
  description?: string;
  slug?: string;
  statusCode?: string;
  tags?: string[];
  customFields?: FactorSetCustomFieldInput[];
}

export type CreateFactorSetPayload = FactorSetPayload;
export type UpdateFactorSetPayload = Partial<FactorSetPayload>;

export interface ReplaceFactorSetMembersPayload {
  factorIds: string[];
}

export interface AddFactorSetMemberPayload {
  factorId: string;
  insertAfterIndex?: number;
}

export interface ReorderFactorSetMembersPayload {
  orderedFactorIds: string[];
}
