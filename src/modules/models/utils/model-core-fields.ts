/** Platform-defined model header fields (not form-builder customValues). */
export const MODEL_SYSTEM_FIELD_KEYS = new Set([
  "drugId",
  "name",
  "displayName",
  "description",
  "frameworkType",
  "statusCode",
  "slug",
  "version",
]);

export function isModelSystemFieldKey(fieldKey: string): boolean {
  return MODEL_SYSTEM_FIELD_KEYS.has(fieldKey);
}
