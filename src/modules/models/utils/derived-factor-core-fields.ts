/** Field ids persisted on derived_factor_definitions (not custom metadata). */
export const CORE_DERIVED_FACTOR_FIELD_IDS = new Set<string>([
  "slug",
  "displayName",
  "unitCode",
  "description",
]);

export function isCoreDerivedFactorField(fieldId: string): boolean {
  return CORE_DERIVED_FACTOR_FIELD_IDS.has(fieldId);
}
