import type { FormulaVariablePoolItem } from "@/modules/models/utils/formula-variable-pool";

const NUMERIC_DATA_TYPES = new Set(["number", "integer", "decimal"]);

export function isNumericDataTypeCode(dataTypeCode?: string | null): boolean {
  if (!dataTypeCode) {
    return true;
  }
  return NUMERIC_DATA_TYPES.has(dataTypeCode.trim().toLowerCase());
}

/** Raw enum/categorical factor instances are never valid formula inputs. */
export function isPoolItemUsableInFormula(item: FormulaVariablePoolItem): boolean {
  if (item.sourceType === "DERIVED_FACTOR") {
    return true;
  }
  return isNumericDataTypeCode(item.dataTypeCode);
}

/** Inputs exposed in Formula Studio (numeric raw + all derived factors). */
export function filterNumericFormulaPool(
  pool: FormulaVariablePoolItem[],
): FormulaVariablePoolItem[] {
  return pool.filter(isPoolItemUsableInFormula);
}

export const FORMULA_PIPELINE_LAYERS = [
  "Raw intake factors",
  "Transformation derived factors (enum → numeric)",
  "Derived factors (math)",
  "Outcome formulas",
] as const;
