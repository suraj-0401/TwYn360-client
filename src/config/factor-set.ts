import {
  FIELD_PROTECTION_LEVEL,
  getFieldProtectionLevel,
} from "@/config/field-protection";
import { WORKSPACE_SLUGS } from "@/config/workspace";

/** Minimum scientific contract on factor-set-form (subset of CORE). */
export const PROTECTED_FACTOR_SET_FORM_FIELDS = [
  "name",
  "displayName",
  "statusCode",
] as const;

/** @deprecated Use `getFieldProtectionLevel` from `@/config/field-protection`. */
export function isProtectedFactorSetFieldKey(
  workspaceSlug: string,
  fieldKey: string,
): boolean {
  if (workspaceSlug !== WORKSPACE_SLUGS.FACTOR_SET_FORM) {
    return false;
  }
  return (
    getFieldProtectionLevel(workspaceSlug, fieldKey) ===
    FIELD_PROTECTION_LEVEL.CORE
  );
}
