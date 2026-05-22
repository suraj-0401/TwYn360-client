/** Field ids persisted as columns on the `factors` table (not customFields). */
export const CORE_FACTOR_FIELD_IDS = new Set<string>([
  "name",
  "displayName",
  "description",
  "categoryCode",
  "dataTypeCode",
  "statusCode",
  "unitCode",
  "required",
  "validations",
  "defaultValue",
  "allowedValues",
  "uiConfig",
  "displayConfig",
  "tags",
  "aliases",
  "references",
  "notes",
]);

export function isCoreFactorField(fieldId: string): boolean {
  return CORE_FACTOR_FIELD_IDS.has(fieldId);
}
