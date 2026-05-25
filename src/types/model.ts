import type { PaginatedList } from "@/platform/pagination";

export type ModelDrugSummary = {
  id: string;
  displayName: string | null;
  slug: string | null;
  status: string;
};

export type ModelSummary = {
  id: string;
  drugId: string;
  drug: ModelDrugSummary;
  name: string;
  slug: string;
  displayName: string;
  frameworkType: string | null;
  statusCode: string;
  version: number;
  factorSetCount: number;
  updatedAt: string;
};

export type ModelListParams = {
  page?: number;
  limit?: number;
  search?: string;
  drugId?: string;
  statusCode?: string;
  frameworkType?: string;
  includeArchived?: boolean;
};

export type ModelListResult = PaginatedList<ModelSummary>;

export type CreateModelPayload = {
  drugId: string;
  name: string;
  displayName: string;
  description?: string;
  slug?: string;
  frameworkType?: string;
  statusCode?: string;
  tags?: string[];
  customValues?: Record<string, unknown>;
};

export type UpdateModelPayload = {
  name?: string;
  displayName?: string;
  description?: string;
  slug?: string;
  frameworkType?: string;
  statusCode?: string;
  tags?: string[];
  customValues?: Record<string, unknown>;
  expectedVersion?: number;
};

export type FactorSetSummary = {
  id: string;
  name: string;
  slug: string;
  displayName: string;
  description: string | null;
  statusCode: string;
  memberCount: number;
};

export type ModelFactorSetLink = {
  id: string;
  factorSetId: string;
  displayOrder: number;
  factorSet: FactorSetSummary;
};

export type ModelDto = {
  id: string;
  drugId: string;
  drug: ModelDrugSummary;
  name: string;
  slug: string;
  displayName: string;
  description: string | null;
  frameworkType: string | null;
  statusCode: string;
  tags: unknown;
  customValues?: Record<string, unknown> | null;
  version: number;
  factorSetCount: number;
  factorSets: ModelFactorSetLink[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type AddModelFactorSetPayload = {
  factorSetId: string;
  insertAfterIndex?: number;
};

export type ReorderModelFactorSetsPayload = {
  orderedFactorSetIds: string[];
};
