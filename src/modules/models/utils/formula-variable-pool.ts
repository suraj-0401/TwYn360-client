export type FormulaVariablePoolItem = {
  alias: string;
  label: string;
  sourceType: "FACTOR_INSTANCE" | "DERIVED_FACTOR";
  instanceId?: string;
  derivedFactorId?: string;
  unitCode?: string | null;
};

type FactorInstanceRow = {
  id: string;
  factor: { slug: string };
  resolved: { displayName: string; unitCode?: string | null };
};

type DerivedFactorRow = {
  id: string;
  slug: string;
  displayName: string;
  unitCode?: string | null;
};

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
}): FormulaVariablePoolItem[] {
  const instances: FormulaVariablePoolItem[] = input.factorInstances.map((item) => ({
    alias: slugToFormulaAlias(item.factor.slug),
    label: item.resolved.displayName,
    sourceType: "FACTOR_INSTANCE",
    instanceId: item.id,
    unitCode: item.resolved.unitCode ?? null,
  }));

  const derived: FormulaVariablePoolItem[] = input.derivedFactors
    .filter((item) => item.id !== input.excludeDerivedFactorId)
    .map((item) => ({
      alias: slugToFormulaAlias(item.slug),
      label: item.displayName,
      sourceType: "DERIVED_FACTOR",
      derivedFactorId: item.id,
      unitCode: item.unitCode ?? null,
    }));

  return [...instances, ...derived];
}
