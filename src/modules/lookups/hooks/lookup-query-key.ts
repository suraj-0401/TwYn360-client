/** React Query key for cached lookup option lists (type code or collection UUID). */
export function lookupQueryKey(collectionOrTypeCode: string) {
  return ["lookup-options", collectionOrTypeCode] as const;
}
