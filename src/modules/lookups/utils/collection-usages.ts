import type { LookupCollectionOverview, LookupUsageRef } from "@/types/lookup-overview";

export function collectionUsages(
  overview: Pick<LookupCollectionOverview, "usages"> | null | undefined,
): LookupUsageRef[] {
  return overview?.usages ?? [];
}
