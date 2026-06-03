import type { FormulaDto, FormulaTargetType } from "@/types/formula";

export function formulaTargetKey(
  targetType: FormulaTargetType | string,
  targetId: string,
): string {
  return `${targetType}:${targetId}`;
}

export function indexFormulasByTarget(
  formulas: FormulaDto[] | undefined,
): Map<string, FormulaDto> {
  const map = new Map<string, FormulaDto>();
  for (const formula of formulas ?? []) {
    if (formula.targetId) {
      map.set(formulaTargetKey(formula.targetType, formula.targetId), formula);
    }
  }
  return map;
}

export function lookupFormulaByTarget(
  index: Map<string, FormulaDto>,
  targetType: FormulaTargetType | string,
  targetId: string,
): FormulaDto | undefined {
  return index.get(formulaTargetKey(targetType, targetId));
}
