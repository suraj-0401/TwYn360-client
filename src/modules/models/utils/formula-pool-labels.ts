import type { FormulaParameterInput } from "@/types/formula";
import type { FormulaVariablePoolItem } from "@/modules/models/utils/formula-variable-pool";

/** User-facing source label for a pool item (matches Parameters step grouping). */
export function describePoolItemSource(item: FormulaVariablePoolItem): string {
  if (item.sourceType === "FACTOR_INSTANCE") {
    return "raw factor";
  }
  if (item.derivedFactorType === "categorical_mapping") {
    return "transform";
  }
  return "derived factor";
}

export function describeParameterSource(
  param: FormulaParameterInput,
  poolByAlias: Map<string, FormulaVariablePoolItem>,
): string {
  if (param.type === "STATIC") {
    return "constant";
  }
  const fromPool = poolByAlias.get(param.alias);
  if (fromPool) {
    return describePoolItemSource(fromPool);
  }
  if (param.sourceType === "DERIVED_FACTOR") {
    return "derived factor";
  }
  return "raw factor";
}

/** Resolve pool metadata for a declared parameter (alias, then binding ids). */
export function resolvePoolItemForParameter(
  param: FormulaParameterInput,
  pool: FormulaVariablePoolItem[],
): FormulaVariablePoolItem | undefined {
  const byAlias = pool.find((item) => item.alias === param.alias);
  if (byAlias) {
    return byAlias;
  }
  if (param.derivedFactorId) {
    return pool.find((item) => item.derivedFactorId === param.derivedFactorId);
  }
  if (param.instanceId) {
    return pool.find((item) => item.instanceId === param.instanceId);
  }
  return undefined;
}
