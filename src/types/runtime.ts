export type RuntimeInputRequirement = {
  alias: string;
  label: string | null;
  unitCode: string | null;
  sourceType: "FACTOR_INSTANCE";
  instanceId: string;
};

export type RuntimePlan = {
  modelId: string;
  runtimeReadyCount: number;
  requiredInputs: RuntimeInputRequirement[];
  derivedFactorOrder: Array<{
    derivedFactorId: string;
    slug: string;
    displayName: string;
  }>;
  outcomes: Array<{
    outcomeId: string;
    slug: string;
    displayName: string;
    runtimeReady: boolean;
  }>;
};

export type RuntimeExecutionResult = {
  modelId: string;
  executionOrder: string[];
  derivedFactors: Array<{
    derivedFactorId: string;
    slug: string;
    displayName: string;
    unitCode: string | null;
    value: number;
  }>;
  outcomes: Array<{
    outcomeId: string;
    slug: string;
    displayName: string;
    unitCode: string | null;
    value: number;
  }>;
};
