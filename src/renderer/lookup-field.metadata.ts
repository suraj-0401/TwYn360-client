/** Canonical lookup field metadata — must match backend shape. */
export type FieldLookupMetadata = {
  collectionId: string;
  searchable?: boolean;
  multiple?: boolean;
  allowCreate?: boolean;
  asyncLoading?: boolean;
};

export const DEFAULT_LOOKUP_METADATA: Omit<FieldLookupMetadata, "collectionId"> = {
  searchable: true,
  multiple: false,
  allowCreate: true,
  asyncLoading: false,
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isLookupCollectionUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function normalizeLookupMetadata(
  raw: unknown,
): FieldLookupMetadata | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }
  const o = raw as Record<string, unknown>;
  const collectionId =
    typeof o.collectionId === "string"
      ? o.collectionId.trim()
      : typeof o.source === "string"
        ? o.source.trim()
        : "";
  if (!collectionId) {
    return undefined;
  }
  return {
    collectionId,
    searchable: o.searchable !== false,
    multiple: o.multiple === true,
    allowCreate: o.allowCreate !== false,
    asyncLoading: o.asyncLoading === true,
  };
}

export function resolveLookupFromField(definition: {
  lookup?: FieldLookupMetadata;
  config?: { lookup?: unknown } | Record<string, unknown> | null;
}): FieldLookupMetadata | undefined {
  if (definition.lookup?.collectionId) {
    return definition.lookup;
  }
  if (definition.config?.lookup) {
    return normalizeLookupMetadata(definition.config.lookup);
  }
  return undefined;
}

export function draftLookupMetadata(): FieldLookupMetadata {
  return {
    collectionId: "",
    ...DEFAULT_LOOKUP_METADATA,
  };
}
