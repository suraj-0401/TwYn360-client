export interface FactorListItem {
  id: string;
  name: string;
  slug: string;
  displayName: string;
  categoryCode: string;
  dataTypeCode: string;
  statusCode: string;
  unitCode: string | null;
  required?: boolean;
  description?: string | null;
  /** Workspace fields stored as factor customFields (e.g. demo lookup). */
  customValues?: Record<string, string | null>;
  version: number;
  updatedAt: string;
}

export interface FactorCustomField {
  id: string;
  key: string;
  label: string;
  value: unknown;
  dataType: string;
  createdAt: string;
}

export interface Factor {
  id: string;
  name: string;
  slug: string;
  displayName: string;
  description: string | null;
  categoryCode: string;
  dataTypeCode: string;
  statusCode: string;
  unitCode: string | null;
  required: boolean;
  validations: Record<string, unknown> | null;
  defaultValue: unknown;
  allowedValues: unknown;
  uiConfig: Record<string, unknown> | null;
  displayConfig: Record<string, unknown> | null;
  tags: string[] | null;
  aliases: string[] | null;
  references: string[] | null;
  notes: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  customFields: FactorCustomField[];
}

export interface FactorListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryCode?: string;
  dataTypeCode?: string;
  statusCode?: string;
  unitCode?: string;
  [key: string]: string | number | undefined;
}

export interface FactorListResult {
  items: FactorListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Workspace field id → value (from factor-form workspace definition). */
export type FactorFormValues = Record<string, unknown>;

export interface PermanentDeletePayload {
  confirmName: string;
}
