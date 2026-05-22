export interface LookupFieldTypeMap {
  [field: string]: "number" | "string" | "stringArray" | "date";
}

export interface LookupMetadata {
  schemaVersion?: number;
  component?: string;
  validationFields?: string[];
  validationHandler?: string;
  fieldTypes?: LookupFieldTypeMap;
  unitRequired?: boolean;
  requiresAllowedValues?: boolean;
}

export interface LookupValue {
  code: string;
  label: string;
  description: string | null;
  displayOrder: number;
  metadata: LookupMetadata | null;
}

export interface CreateLookupValuePayload {
  code: string;
  label: string;
  description?: string;
  displayOrder?: number;
  metadata?: LookupMetadata;
}
