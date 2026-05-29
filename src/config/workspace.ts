/** Metadata workspace slugs served by the API. */
export const WORKSPACE_SLUGS = {
  FACTOR_REGISTRY: "factor-form",
  FACTOR_SET_FORM: "factor-set-form",
  CATEGORY_FORM: "category-form",
  DRUG_FORM: "drug-form",
  MODEL_FORM: "model-form",
  DERIVED_FACTOR_FORM: "derived-factor-form",
  OUTCOME_FORM: "outcome-form",
} as const;

export type WorkspaceSlug = (typeof WORKSPACE_SLUGS)[keyof typeof WORKSPACE_SLUGS];
