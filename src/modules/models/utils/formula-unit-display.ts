import type { FormulaParameterInput } from "@/types/formula";
import type { FormulaVariablePoolItem } from "@/modules/models/utils/formula-variable-pool";

/** Display unit code from registry / outcome metadata (lookup code as label). */
export function formatUnitLabel(unitCode: string | null | undefined): string | null {
  if (!unitCode || !unitCode.trim()) {
    return null;
  }
  return unitCode.trim();
}

export function buildUnitByAlias(
  pool: FormulaVariablePoolItem[],
): Map<string, string | null> {
  const map = new Map<string, string | null>();
  for (const item of pool) {
    map.set(item.alias, formatUnitLabel(item.unitCode));
  }
  return map;
}

export function resolveParameterUnit(
  param: FormulaParameterInput,
  unitByAlias: Map<string, string | null>,
): string | null {
  return unitByAlias.get(param.alias) ?? null;
}

export function formatValueWithUnit(value: string | number, unit: string | null): string {
  const text = typeof value === "number" ? String(value) : value;
  if (!unit) {
    return text;
  }
  return `${text} ${unit}`;
}
