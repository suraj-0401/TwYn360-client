import { isLookupCollectionId } from "@/modules/lookups/utils/resolve-collection-key";
import {
  listCollectionValues,
  listCollectionValuesByCode,
} from "@/services/lookup-collection.service";

export type LookupOption = {
  valueId: string;
  code: string;
  label: string;
  description?: string | null;
  displayOrder?: number;
  isSystem?: boolean;
  metadata?: unknown;
};

/** Load active dropdown options for a collection UUID or type code. */
export async function fetchLookupOptions(
  collectionOrTypeCode: string,
): Promise<LookupOption[]> {
  if (!collectionOrTypeCode) {
    return [];
  }

  const response = isLookupCollectionId(collectionOrTypeCode)
    ? await listCollectionValues(collectionOrTypeCode)
    : await listCollectionValuesByCode(collectionOrTypeCode);

  return response.data.map((item) => ({
    valueId: item.id,
    code: item.code,
    label: item.label,
    description: item.description,
    displayOrder: item.displayOrder,
    isSystem: item.isSystem,
    metadata: item.metadata,
  }));
}
