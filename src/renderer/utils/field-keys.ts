/** Match backend `toRendererFieldId` for workspace field lookup. */
export function toRendererFieldId(raw: string): string {
  const trimmed = raw.trim();
  if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmed)) {
    return trimmed;
  }

  const parts = trimmed.split(/[-_]+/).filter(Boolean);
  if (parts.length === 0) {
    return "field";
  }

  const [first, ...rest] = parts;
  const head = first.toLowerCase();
  const tail = rest
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join("");

  return `${head}${tail}`.slice(0, 64);
}

/** Globally unique renderer field id across all sections in one payload. */
export function allocateRendererFieldId(
  fieldKey: string,
  sectionKey: string,
  used: Set<string>,
): string {
  const base = toRendererFieldId(fieldKey);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  const sectionPart = toRendererFieldId(sectionKey.replace(/-/g, "_"));
  const scoped = `${sectionPart}_${base}`;
  if (!used.has(scoped)) {
    used.add(scoped);
    return scoped;
  }

  let index = 2;
  while (used.has(`${base}_${index}`)) {
    index += 1;
  }
  const suffixed = `${base}_${index}`;
  used.add(suffixed);
  return suffixed;
}

/** Unique field_key within a section (e.g. lookup, lookup_2). */
export function allocateUniqueFieldKeyInSection(
  existingFieldKeys: string[],
  preferredKey: string,
): string {
  const base = toRendererFieldId(preferredKey);
  const taken = new Set(existingFieldKeys.map((key) => toRendererFieldId(key)));

  if (!taken.has(base)) {
    return base;
  }

  let index = 2;
  while (taken.has(`${base}_${index}`)) {
    index += 1;
  }
  return `${base}_${index}`;
}

/**
 * True when a payload field id corresponds to a DB field_key.
 * Must not treat lookup_2 as an alias of lookup (that merged settings/collections).
 */
export function rendererFieldIdMatchesKey(
  rendererFieldId: string,
  fieldKey: string,
): boolean {
  const id = toRendererFieldId(rendererFieldId);
  const key = toRendererFieldId(fieldKey);

  if (id === key) {
    return true;
  }

  // Section-scoped id from allocateRendererFieldId, e.g. general_lookup → lookup
  if (id.endsWith(`_${key}`)) {
    const prefix = id.slice(0, -(key.length + 1));
    return prefix.length > 0;
  }

  return false;
}

