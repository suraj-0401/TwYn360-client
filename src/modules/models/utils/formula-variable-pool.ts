export type FormulaVariablePoolItem = {
  alias: string;
  label: string;
  sourceType: "FACTOR_INSTANCE" | "DERIVED_FACTOR";
  instanceId?: string;
  derivedFactorId?: string;
  unitCode?: string | null;
  dataTypeCode?: string | null;
  derivedFactorType?: "formula" | "categorical_mapping";
  enumOptions?: Array<{ value: string; label: string }>;
  enumValueToNumber?: Record<string, number>;
  mappedDerivedFactorId?: string;
};

type FactorInstanceRow = {
  id: string;
  factor: { slug: string; dataTypeCode?: string };
  resolved: {
    displayName: string;
    unitCode?: string | null;
    dataTypeCode?: string;
    allowedValues?: unknown;
    validations?: unknown;
  };
};

type DerivedFactorRow = {
  id: string;
  slug: string;
  displayName: string;
  unitCode?: string | null;
  derivedFactorType?: "formula" | "categorical_mapping";
  mappingConfig?: {
    sourceFactorInstanceId?: string;
    mappings?: Array<{ key: string; value: number }>;
  } | null;
};

function toEnumOptions(
  allowedValues: unknown,
  validations?: unknown,
): Array<{ value: string; label: string }> | undefined {
  const source =
    Array.isArray(allowedValues) && allowedValues.length > 0
      ? allowedValues
      : validations &&
          typeof validations === "object" &&
          Array.isArray((validations as { options?: unknown }).options)
        ? (validations as { options: unknown[] }).options
        : null;

  if (!source || source.length === 0) {
    return undefined;
  }

  return source
    .map((entry) => {
      if (entry && typeof entry === "object" && "value" in entry) {
        const row = entry as { value: unknown; label?: unknown };
        const value = String(row.value ?? "").trim();
        if (!value) return null;
        const label =
          typeof row.label === "string" && row.label.trim().length > 0
            ? row.label
            : value;
        return { value, label };
      }
      const value = String(entry ?? "").trim();
      if (!value) return null;
      return { value, label: value };
    })
    .filter((item): item is { value: string; label: string } => item !== null);
}

export function poolItemKey(item: FormulaVariablePoolItem): string {
  return item.sourceType === "DERIVED_FACTOR"
    ? `derived:${item.derivedFactorId}`
    : `instance:${item.instanceId}`;
}

/** Formula DSL identifiers: underscores only (slugs may contain hyphens). */
export function slugToFormulaAlias(slug: string): string {
  return slug.trim().replace(/-/g, "_");
}

/** Inputs available when authoring outcome or derived-factor formulas. */
export function buildFormulaVariablePool(input: {
  factorInstances: FactorInstanceRow[];
  derivedFactors: DerivedFactorRow[];
  /** Omit self when editing a derived factor's formula. */
  excludeDerivedFactorId?: string | null;
  /** Prefer mapping config from this derived factor when source collides. */
  preferredMappingDerivedFactorId?: string | null;
}): FormulaVariablePoolItem[] {
  const mappingBySourceInstance = new Map<string, Record<string, number>>();
  const mappingDerivedBySourceInstance = new Map<string, string>();
  let preferredMappingRow: DerivedFactorRow | null = null;
  for (const derived of input.derivedFactors) {
    if (
      input.preferredMappingDerivedFactorId &&
      derived.id === input.preferredMappingDerivedFactorId
    ) {
      preferredMappingRow = derived;
    }
    if (derived.derivedFactorType !== "categorical_mapping") {
      continue;
    }
    const sourceInstanceId = derived.mappingConfig?.sourceFactorInstanceId;
    const mappings = derived.mappingConfig?.mappings ?? [];
    if (!sourceInstanceId || mappings.length === 0) {
      continue;
    }
    const map: Record<string, number> = {};
    for (const rule of mappings) {
      const key = String(rule.key ?? "").trim();
      if (!key) continue;
      map[key] = Number(rule.value);
    }
    if (Object.keys(map).length > 0) {
      mappingBySourceInstance.set(sourceInstanceId, map);
      mappingDerivedBySourceInstance.set(sourceInstanceId, derived.id);
    }
  }

  if (preferredMappingRow?.derivedFactorType === "categorical_mapping") {
    const sourceInstanceId = preferredMappingRow.mappingConfig?.sourceFactorInstanceId;
    const mappings = preferredMappingRow.mappingConfig?.mappings ?? [];
    if (sourceInstanceId && mappings.length > 0) {
      const preferredMap: Record<string, number> = {};
      for (const rule of mappings) {
        const key = String(rule.key ?? "").trim();
        if (!key) continue;
        preferredMap[key] = Number(rule.value);
      }
      if (Object.keys(preferredMap).length > 0) {
        mappingBySourceInstance.set(sourceInstanceId, preferredMap);
        mappingDerivedBySourceInstance.set(sourceInstanceId, preferredMappingRow.id);
      }
    }
  }

  const instances: FormulaVariablePoolItem[] = input.factorInstances.map((item) => ({
    ...(() => {
      const enumValueToNumber = mappingBySourceInstance.get(item.id);
      const mappedOptions = enumValueToNumber
        ? Object.keys(enumValueToNumber).map((key) => ({ value: key, label: key }))
        : undefined;
      return {
        enumOptions:
          mappedOptions && mappedOptions.length > 0
            ? mappedOptions
            : toEnumOptions(item.resolved.allowedValues, item.resolved.validations),
        enumValueToNumber,
        mappedDerivedFactorId: mappingDerivedBySourceInstance.get(item.id),
      };
    })(),
    alias: slugToFormulaAlias(item.factor.slug),
    label: item.resolved.displayName,
    sourceType: "FACTOR_INSTANCE",
    instanceId: item.id,
    unitCode: item.resolved.unitCode ?? null,
    dataTypeCode: item.resolved.dataTypeCode ?? item.factor.dataTypeCode ?? null,
  }));

  const derived: FormulaVariablePoolItem[] = input.derivedFactors
    .filter((item) => item.id !== input.excludeDerivedFactorId)
    .map((item) => {
      const isTransformation = item.derivedFactorType === "categorical_mapping";
      const enumValueToNumber = isTransformation
        ? Object.fromEntries(
            (item.mappingConfig?.mappings ?? [])
              .map((rule) => {
                const key = String(rule.key ?? "").trim();
                if (!key) {
                  return null;
                }
                return [key, Number(rule.value)] as const;
              })
              .filter((entry): entry is [string, number] => entry !== null),
          )
        : undefined;
      const enumOptions =
        enumValueToNumber && Object.keys(enumValueToNumber).length > 0
          ? Object.keys(enumValueToNumber).map((key) => ({
              value: key,
              label: key,
            }))
          : undefined;

      return {
        alias: slugToFormulaAlias(item.slug),
        label: item.displayName,
        sourceType: "DERIVED_FACTOR" as const,
        derivedFactorId: item.id,
        unitCode: item.unitCode ?? null,
        derivedFactorType: item.derivedFactorType ?? "formula",
        enumOptions,
        enumValueToNumber,
      };
    });

  return [...instances, ...derived];
}
