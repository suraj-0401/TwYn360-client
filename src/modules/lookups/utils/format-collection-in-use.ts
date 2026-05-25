import type { LookupCollectionOverview } from "@/types/lookup-overview";
import { collectionUsages } from "./collection-usages";

/** Human-readable block for danger zone when delete is blocked. */
export function formatCollectionInUseMessage(
  overview: LookupCollectionOverview,
): string {
  const labels = [...new Set(collectionUsages(overview).map((u) => u.label))];
  if (labels.length === 0) {
    return "This collection is in use.";
  }
  if (labels.length === 1) {
    return `Used in ${labels[0]}.`;
  }
  if (labels.length === 2) {
    return `Used in ${labels[0]} and ${labels[1]}.`;
  }
  const rest = labels.length - 2;
  return `Used in ${labels[0]}, ${labels[1]}, and ${rest} more.`;
}

export function collectionCanDelete(overview: LookupCollectionOverview): boolean {
  return !overview.isSystem && collectionUsages(overview).length === 0;
}
