/** Metadata workspace slugs served by the API. */
export const WORKSPACE_SLUGS = {
  FACTOR_REGISTRY: "factor-form",
  FACTOR_SET_FORM: "factor-set-form",
  CATEGORY_FORM: "category-form",
  DRUG_FORM: "drug-form",
} as const;

export type WorkspaceSlug = (typeof WORKSPACE_SLUGS)[keyof typeof WORKSPACE_SLUGS];
