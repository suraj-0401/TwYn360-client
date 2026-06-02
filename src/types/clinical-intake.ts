export type ClinicalIntakeModel = {
  id: string;
  displayName: string;
  slug: string;
  statusCode: string;
  drugDisplayName: string | null;
};

export type ClinicalIntakeInput = {
  instanceId: string;
  alias: string;
  factorSlug: string;
  factorSetId: string | null;
  displayOrder: number;
  label: string;
  dataTypeCode: string;
  categoryCode: string;
  unitCode: string | null;
  unitDisplayLabel: string | null;
  required: boolean;
  runtimeRequired: boolean;
  defaultValue: unknown | null;
  validations: unknown | null;
  allowedValues: unknown | null;
  uiConfig: unknown | null;
};

export type ClinicalIntakeSection = {
  factorSetId: string | null;
  slug: string;
  title: string;
  description: string | null;
  displayOrder: number;
  inputs: ClinicalIntakeInput[];
};

export type ClinicalIntakeOutcomeOutput = {
  outcomeId: string;
  slug: string;
  alias: string;
  displayName: string;
  unitCode: string | null;
  unitDisplayLabel: string | null;
  runtimeReady: boolean;
};

export type ClinicalIntakeSchema = {
  model: ClinicalIntakeModel;
  inputs: ClinicalIntakeInput[];
  sections: ClinicalIntakeSection[];
  outputs: {
    outcomes: ClinicalIntakeOutcomeOutput[];
  };
  runtimeReadyCount: number;
};
