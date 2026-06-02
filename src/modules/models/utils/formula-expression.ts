/**
 * Formula expression storage contract (Step 0):
 * - UI/editor: `{targetAlias} = {rhs}` for readability
 * - Persisted `rawExpression`: RHS only (no target assignment)
 * - Parser/runtime: RHS only
 */

/** Strip a leading `{targetAlias} =` assignment when present; otherwise return trimmed input. */
export function extractFormulaRhs(
  expression: string,
  targetAlias: string,
): string {
  const trimmed = expression.trim();
  if (!trimmed) {
    return "";
  }

  const equalsIndex = trimmed.indexOf("=");
  if (equalsIndex === -1) {
    return trimmed;
  }

  const lhs = trimmed.slice(0, equalsIndex).trim();
  if (lhs !== targetAlias.trim()) {
    return trimmed;
  }

  return trimmed.slice(equalsIndex + 1).trim();
}

/** Normalize persisted/API expression to RHS-only form. */
export function normalizeStoredFormulaExpression(
  storedExpression: string,
  targetAlias: string,
): string {
  return extractFormulaRhs(storedExpression, targetAlias);
}

/** Build editor display value from stored RHS (or legacy assignment string). */
export function toDisplayFormulaExpression(
  targetAlias: string,
  storedExpression: string | null | undefined,
): string {
  const rhs = normalizeStoredFormulaExpression(storedExpression ?? "", targetAlias);
  if (!rhs) {
    return `${targetAlias} = `;
  }
  return `${targetAlias} = ${rhs}`;
}

/** Value to persist in `rawExpression` from the editor display string. */
export function toStoredFormulaExpression(
  displayExpression: string,
  targetAlias: string,
): string {
  return normalizeStoredFormulaExpression(displayExpression, targetAlias);
}

/** Expression body sent to simulation parse/normalize endpoints. */
export function toParseFormulaExpression(
  displayExpression: string,
  targetAlias: string,
): string {
  return toStoredFormulaExpression(displayExpression, targetAlias);
}
