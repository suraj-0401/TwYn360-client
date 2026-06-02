export type FormulaParameterDto = {
  id?: string;
  alias: string;
  type: "DYNAMIC" | "STATIC";
  sourceType?: "FACTOR_INSTANCE" | "DERIVED_FACTOR" | null;
  instanceId?: string | null;
  derivedFactorId?: string | null;
  defaultValue?: number | null;
  label?: string | null;
  sortOrder?: number;
};

export type FormulaParameterInput = {
  alias: string;
  type: "DYNAMIC" | "STATIC";
  sourceType?: "FACTOR_INSTANCE" | "DERIVED_FACTOR";
  instanceId?: string;
  derivedFactorId?: string;
  defaultValue?: number;
  label?: string;
  sortOrder?: number;
};

export type ExtractedDependenciesDto = {
  variables: string[];
  functions: string[];
  operators: string[];
};

export type FormulaDto = {
  id: string;
  targetType: string;
  targetId: string;
  formulaKind: string;
  targetInstanceId: string | null;
  modelId: string;
  formulaType: string;
  framework: string | null;
  frameworkVersion: string | null;
  status: string;
  rawExpression: string;
  aliasMap: Record<string, string> | null;
  formulaParameters?: FormulaParameterDto[];
  extractedDependencies: ExtractedDependenciesDto | null;
  dependencyHash: string | null;
  compiledAt: string | null;
  validationErrors: unknown;
  validationStatusReason: string | null;
  statisticalParameters: Record<string, unknown> | null;
  manualMode: boolean;
  runtimeReady: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type FormulaReviewDecisionDto = {
  id: string;
  versionId: string;
  decision: string;
  reviewedBy: string;
  comment: string | null;
  createdAt: string;
};

export type FormulaVersionDto = {
  id: string;
  formulaId: string;
  snapshotExpression: string;
  snapshotAliasMap: Record<string, string> | null;
  snapshotFramework: string | null;
  snapshotFrameworkVersion: string | null;
  snapshotCoefficients: unknown;
  snapshotParameters?: unknown;
  changeNote: string | null;
  createdBy: string | null;
  createdAt: string;
  reviewDecision: FormulaReviewDecisionDto | null;
};

export type OutcomeDefinitionDto = {
  id: string;
  modelId: string;
  slug: string;
  displayName: string;
  description: string | null;
  unitCode: string | null;
  statusCode: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type DerivedFactorDefinitionDto = {
  id: string;
  modelId: string;
  slug: string;
  displayName: string;
  description: string | null;
  unitCode: string | null;
  statusCode: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type FormulaTargetType = "outcome" | "derived_factor" | "factor_instance";

export type FormulaTargetSelection = {
  targetType: FormulaTargetType;
  targetId: string;
  label: string;
  slug: string;
  formulaKind: string;
};
