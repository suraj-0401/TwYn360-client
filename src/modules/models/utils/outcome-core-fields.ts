export const CORE_OUTCOME_FIELD_IDS = new Set<string>([
  "slug",
  "displayName",
  "unitCode",
  "description",
]);

export function isCoreOutcomeField(fieldId: string): boolean {
  return CORE_OUTCOME_FIELD_IDS.has(fieldId);
}
