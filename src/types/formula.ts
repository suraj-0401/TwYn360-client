export type FormulaDto = {
  id: string;
  targetInstanceId: string;
  modelId: string;
  formulaType: string;
  framework: string;
  frameworkVersion: string | null;
  status: string;
  rawExpression: string;
  aliasMap: Record<string, string> | null;
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
  changeNote: string | null;
  createdBy: string | null;
  createdAt: string;
  reviewDecision: FormulaReviewDecisionDto | null;
};
