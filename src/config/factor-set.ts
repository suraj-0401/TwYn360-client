import { WORKSPACE_SLUGS } from "@/config/workspace";

/** Required on factor-set-form workspace (matches server guard). */
export const PROTECTED_FACTOR_SET_FORM_FIELDS = [
  "name",
  "displayName",
  "statusCode",
] as const;

export function isProtectedFactorSetFieldKey(
  workspaceSlug: string,
  fieldKey: string,
): boolean {
  if (workspaceSlug !== WORKSPACE_SLUGS.FACTOR_SET_FORM) {
    return false;
  }
  return PROTECTED_FACTOR_SET_FORM_FIELDS.includes(
    fieldKey as (typeof PROTECTED_FACTOR_SET_FORM_FIELDS)[number],
  );
}
