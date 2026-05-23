/** Field ids persisted as columns on the `factor_sets` table (not customFields). */
export const CORE_FACTOR_SET_FIELD_IDS = new Set<string>([
  "name",
  "displayName",
  "description",
  "slug",
  "statusCode",
  "tags",
]);

export function isCoreFactorSetField(fieldId: string): boolean {
  return CORE_FACTOR_SET_FIELD_IDS.has(fieldId);
}
