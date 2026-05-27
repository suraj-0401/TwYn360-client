/**
 * G1 — field protection levels (mirrors dff-service platform/governance/field-protection.ts).
 * @see services/dff-service/docs/GOVERNANCE.md
 */

import { WORKSPACE_SLUGS } from "@/config/workspace";
import {
  entityTypeSlugForWorkspace,
  isEntityRecordWorkspaceSlug,
  PROTECTED_ENTITY_FIELDS,
} from "@/config/platform";
import { isCoreFactorField } from "@/modules/factors/utils/factor-core-fields";
import { isCoreFactorSetField } from "@/modules/factor-sets/utils/factor-set-core-fields";

export const FIELD_PROTECTION_LEVEL = {
  SYSTEM: "SYSTEM",
  CORE: "CORE",
  CUSTOM: "CUSTOM",
} as const;

export type FieldProtectionLevel =
  (typeof FIELD_PROTECTION_LEVEL)[keyof typeof FIELD_PROTECTION_LEVEL];

/** Builder UI badge text (G1). */
export const PROTECTION_BADGE_LABEL: Record<FieldProtectionLevel, string> = {
  [FIELD_PROTECTION_LEVEL.SYSTEM]: "Locked",
  [FIELD_PROTECTION_LEVEL.CORE]: "Core",
  [FIELD_PROTECTION_LEVEL.CUSTOM]: "Custom",
};

const SYSTEM_FIELD_KEYS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
  "version",
]);

export function getFieldProtectionLevel(
  workspaceSlug: string,
  fieldKey: string,
): FieldProtectionLevel {
  if (SYSTEM_FIELD_KEYS.has(fieldKey)) {
    return FIELD_PROTECTION_LEVEL.SYSTEM;
  }

  if (workspaceSlug === WORKSPACE_SLUGS.FACTOR_REGISTRY) {
    return isCoreFactorField(fieldKey)
      ? FIELD_PROTECTION_LEVEL.CORE
      : FIELD_PROTECTION_LEVEL.CUSTOM;
  }

  if (workspaceSlug === WORKSPACE_SLUGS.FACTOR_SET_FORM) {
    return isCoreFactorSetField(fieldKey)
      ? FIELD_PROTECTION_LEVEL.CORE
      : FIELD_PROTECTION_LEVEL.CUSTOM;
  }

  if (isEntityRecordWorkspaceSlug(workspaceSlug)) {
    const entityType = entityTypeSlugForWorkspace(workspaceSlug);
    if (
      entityType &&
      PROTECTED_ENTITY_FIELDS[entityType].includes(fieldKey)
    ) {
      return FIELD_PROTECTION_LEVEL.CORE;
    }
    return FIELD_PROTECTION_LEVEL.CUSTOM;
  }

  return FIELD_PROTECTION_LEVEL.CUSTOM;
}

export function canRemoveWorkspaceField(
  protection: FieldProtectionLevel,
): boolean {
  return protection === FIELD_PROTECTION_LEVEL.CUSTOM;
}

export function isRemovableWorkspaceField(
  workspaceSlug: string,
  fieldKey: string,
): boolean {
  return canRemoveWorkspaceField(getFieldProtectionLevel(workspaceSlug, fieldKey));
}
