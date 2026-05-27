export type ModelFactorInstanceOverrides = {
  unitCode: string | null;
  required: boolean | null;
  defaultValue: unknown | null;
  validations: unknown | null;
  allowedValues: unknown | null;
  displayName: string | null;
  uiConfig: unknown | null;
};

export type ModelFactorInstanceFactor = {
  id: string;
  slug: string;
  displayName: string;
  dataTypeCode: string;
  categoryCode: string;
  statusCode: string;
};

export type ModelFactorInstanceSourceSet = {
  id: string;
  slug: string;
  displayName: string;
  statusCode: string;
};

export type ModelFactorInstance = {
  id: string;
  modelId: string;
  factorId: string;
  sourceFactorSetId: string | null;
  displayOrder: number;
  overrides: ModelFactorInstanceOverrides;
  hasOverrides: boolean;
  factor: ModelFactorInstanceFactor;
  sourceFactorSet: ModelFactorInstanceSourceSet | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type ResolvedModelFactorInstance = ModelFactorInstance & {
  resolved: {
    unitCode: string | null;
    required: boolean;
    defaultValue: unknown | null;
    validations: unknown | null;
    allowedValues: unknown | null;
    displayName: string;
    uiConfig: unknown | null;
    dataTypeCode: string;
    categoryCode: string;
  };
};

export type UpdateModelFactorInstancePayload = {
  expectedVersion?: number;
  overrideUnitCode?: string | null;
  overrideRequired?: boolean | null;
  overrideDefaultValue?: unknown | null;
  overrideValidations?: unknown | null;
  overrideAllowedValues?: unknown | null;
  overrideDisplayName?: string | null;
  overrideUiConfig?: unknown | null;
};
