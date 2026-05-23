import { isLookupCollectionId } from "@/modules/lookups/utils/resolve-collection-key";
import {
  archiveCollectionValue,
  createCollectionValue,
  createCollectionValueByCode,
  deleteCollectionValue,
  type CreateLookupCollectionValuePayload,
} from "@/services/lookup-collection.service";

export async function createLookupCollectionValue(
  collectionOrCode: string,
  payload: CreateLookupCollectionValuePayload,
  adminKey?: string,
) {
  if (isLookupCollectionId(collectionOrCode)) {
    return createCollectionValue(collectionOrCode, payload, adminKey);
  }
  return createCollectionValueByCode(collectionOrCode, payload, adminKey);
}

export async function removeLookupCollectionValue(
  collectionOrCode: string,
  row: { valueId?: string; code: string },
  adminKey?: string,
) {
  if (!adminKey) {
    throw new Error("Admin API key is required to remove values.");
  }
  if (row.valueId) {
    try {
      await archiveCollectionValue(row.valueId, adminKey);
      return;
    } catch {
      await deleteCollectionValue(row.valueId, adminKey);
      return;
    }
  }
  throw new Error("Cannot remove value without id");
}
