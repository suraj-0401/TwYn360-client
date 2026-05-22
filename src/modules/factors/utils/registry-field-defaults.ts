import { isCoreFactorField } from "./factor-core-fields";
import { normalizeFieldType } from "@/renderer/field-metadata.registry";
import type { FieldConfig } from "@/renderer/types";

const REGISTRY_LIST_DEFAULTS = new Set([
  "displayName",
  "categoryCode",
  "dataTypeCode",
  "statusCode",
  "unitCode",
  "required",
]);

const REGISTRY_FILTER_LOOKUP_DEFAULTS = new Set([
  "categoryCode",
  "dataTypeCode",
  "unitCode",
]);

/** Default registry flags when adding fields to the factor-form workspace. */
export function mergeFactorRegistryConfigDefaults(
  fieldKey: string,
  fieldType: string,
  config: FieldConfig,
): FieldConfig {
  const next: FieldConfig = { ...config };
  const type = normalizeFieldType(fieldType);

  if (REGISTRY_LIST_DEFAULTS.has(fieldKey)) {
    next.registryList ??= true;
  }

  if (type === "lookup") {
    if (REGISTRY_FILTER_LOOKUP_DEFAULTS.has(fieldKey)) {
      next.registryFilter ??= true;
    }
    if (fieldKey === "statusCode") {
      next.registryBadge ??= true;
    }
    if (!isCoreFactorField(fieldKey) && fieldKey !== "name") {
      next.registryList ??= true;
      next.registryFilter ??= true;
    }
  }

  return next;
}
