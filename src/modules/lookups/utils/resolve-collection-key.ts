import { isLookupCollectionUuid } from "@/renderer/lookup-field.metadata";

/** Collection UUID or seeded lookup type code (e.g. FACTOR_STATUS). */
export function isLookupCollectionKey(key: string): boolean {
  return Boolean(key?.trim());
}

export function isLookupCollectionId(key: string): boolean {
  return isLookupCollectionUuid(key);
}
