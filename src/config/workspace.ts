/** Metadata workspace slugs served by the API. */
export const WORKSPACE_SLUGS = {
  FACTOR_REGISTRY: "factor-form",
} as const;

export type WorkspaceSlug = (typeof WORKSPACE_SLUGS)[keyof typeof WORKSPACE_SLUGS];
