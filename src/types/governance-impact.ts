export type FactorUsageImpact = {
  factorSetCount: number;
  activeFactorSetCount: number;
  modelCount: number;
  modelInstanceCount: number;
};

export type FactorSetUsageImpact = {
  memberCount: number;
  linkedModelCount: number;
  activeModelCount: number;
  preservedInstanceCount: number;
};

export type FactorSetMemberRemoveImpact = {
  activeModelCount: number;
  preservedInstanceCount: number;
};

export type ModelDetachImpact = {
  modelStatusCode: string;
  instanceCount: number;
  instancesRemovedOnDetach: boolean;
};
