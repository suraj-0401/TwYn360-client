import { isLookupCollectionUuid } from "@/renderer/lookup-field.metadata";
import { listCollectionValues } from "@/services/lookup-collection.service";
import { getLookupValues } from "@/services/lookup.service";
import type { LookupValue } from "@/types/lookup";

export type LookupOption = {
  /** UUID for collection values; omitted for legacy type-code lists. */
  valueId?: string;
  code: string;
  label: string;
  description?: string | null;
  displayOrder?: number;
  metadata?: unknown;
};

/** Load dropdown options for a legacy type code or lookup collection UUID. */
export async function fetchLookupOptions(
  collectionOrTypeCode: string,
): Promise<LookupOption[]> {
  if (!collectionOrTypeCode) {
    return [];
  }

  if (isLookupCollectionUuid(collectionOrTypeCode)) {
    const response = await listCollectionValues(collectionOrTypeCode);
    return response.data.map((item) => ({
      valueId: item.id,
      code: item.code,
      label: item.label,
      description: item.description,
      displayOrder: item.displayOrder,
      metadata: item.metadata,
    }));
  }

  const response = await getLookupValues(collectionOrTypeCode);
  return response.data.map((item: LookupValue) => ({
    code: item.code,
    label: item.label,
    description: item.description,
    displayOrder: item.displayOrder,
    metadata: item.metadata,
  }));
}
