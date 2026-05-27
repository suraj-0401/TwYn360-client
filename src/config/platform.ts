import {
  FIELD_PROTECTION_LEVEL,
  getFieldProtectionLevel,
} from "@/config/field-protection";
import { WORKSPACE_SLUGS, type WorkspaceSlug } from "@/config/workspace";

/** Platform entity type slugs (must match dff-service seed). */
export const ENTITY_TYPE = {
  CATEGORY: "category",
  DRUG: "drug",
} as const;

export type EntityTypeSlug = (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE];

/** Maps entity form workspace slug → entity type slug (Phase C1/C3). */
export const WORKSPACE_SLUG_TO_ENTITY_TYPE: Record<string, EntityTypeSlug> = {
  [WORKSPACE_SLUGS.CATEGORY_FORM]: ENTITY_TYPE.CATEGORY,
  [WORKSPACE_SLUGS.DRUG_FORM]: ENTITY_TYPE.DRUG,
};

export function isEntityRecordWorkspaceSlug(
  slug: string,
): slug is WorkspaceSlug {
  return slug in WORKSPACE_SLUG_TO_ENTITY_TYPE;
}

export function entityTypeSlugForWorkspace(
  slug: string,
): EntityTypeSlug | undefined {
  return WORKSPACE_SLUG_TO_ENTITY_TYPE[slug];
}

/** Fields that must stay on the entity schema (Phase C2/C3). */
export const PROTECTED_ENTITY_FIELDS: Record<EntityTypeSlug, readonly string[]> = {
  [ENTITY_TYPE.CATEGORY]: ["name", "statusCode"],
  [ENTITY_TYPE.DRUG]: ["name", "statusCode", "categoryId"],
};

/** @deprecated Use `getFieldProtectionLevel` from `@/config/field-protection`. */
export function isProtectedEntityFieldKey(
  workspaceSlug: string,
  fieldKey: string,
): boolean {
  return (
    getFieldProtectionLevel(workspaceSlug, fieldKey) ===
    FIELD_PROTECTION_LEVEL.CORE
  );
}

export {
  LIFECYCLE_STATUS,
  LIFECYCLE_STATUSES,
  LIFECYCLE_STATUS_LOOKUP,
  RECORD_STATUS_LOOKUP,
  formatLifecycleStatus,
  isArchivedLifecycle,
  isDeletedLifecycle,
  isLifecycleStatus,
  type LifecycleStatus,
} from "@/config/lifecycle";
