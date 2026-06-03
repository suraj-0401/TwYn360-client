import type { ResolvedModelFactorInstance } from "@/types/model-factor-instance";

export type EnumOption = { value: string; label: string };

/** Enum choices from factor definition (allowedValues or validations.options). */
export function getEnumOptionsFromInstance(
  instance: Pick<ResolvedModelFactorInstance, "resolved">,
): EnumOption[] {
  const allowedValues = instance.resolved.allowedValues;
  const validations = instance.resolved.validations;
  const source =
    Array.isArray(allowedValues) && allowedValues.length > 0
      ? allowedValues
      : validations &&
          typeof validations === "object" &&
          Array.isArray((validations as { options?: unknown }).options)
        ? (validations as { options: unknown[] }).options
        : null;

  if (!source?.length) {
    return [];
  }

  return source
    .map((entry) => {
      if (entry && typeof entry === "object" && "value" in entry) {
        const row = entry as { value: unknown; label?: unknown };
        const value = String(row.value ?? "").trim();
        if (!value) {
          return null;
        }
        const label =
          typeof row.label === "string" && row.label.trim().length > 0
            ? row.label
            : value;
        return { value, label };
      }
      const value = String(entry ?? "").trim();
      if (!value) {
        return null;
      }
      return { value, label: value };
    })
    .filter((item): item is EnumOption => item !== null);
}

export function normalizeEnumKey(value: string): string {
  return value.trim().toLowerCase();
}

export type MappingRowDraft = { key: string; value: string };

export function isFactorDefinedEnumKey(
  key: string,
  options: EnumOption[],
): boolean {
  const normalized = normalizeEnumKey(key);
  if (!normalized) {
    return false;
  }
  return options.some((opt) => normalizeEnumKey(opt.value) === normalized);
}

/** Sync factor-defined rows; preserve admin-added custom rows at the end. */
export function syncMappingRowsFromEnumOptions(
  existing: MappingRowDraft[],
  options: EnumOption[],
): MappingRowDraft[] {
  const valueByKey = new Map(
    existing.map((row) => [normalizeEnumKey(row.key), row.value] as const),
  );
  const factorKeys = new Set(
    options.map((opt) => normalizeEnumKey(opt.value)),
  );

  const fromFactor = options.map((opt, index) => ({
    key: opt.value,
    value: valueByKey.get(normalizeEnumKey(opt.value)) ?? String(index),
  }));

  const custom = existing.filter((row) => {
    const normalized = normalizeEnumKey(row.key);
    return normalized.length > 0 && !factorKeys.has(normalized);
  });

  return [...fromFactor, ...custom];
}
