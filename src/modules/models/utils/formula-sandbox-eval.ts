import { FORMULA_DSL_FUNCTIONS } from "@/modules/models/constants/formula-dsl";

const DSL_FUNCTION_NAMES = new Set(
  FORMULA_DSL_FUNCTIONS.map((name) => name.toLowerCase()),
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyMathFunctions(expression: string): string {
  let result = expression;
  for (const name of FORMULA_DSL_FUNCTIONS) {
    result = result.replace(new RegExp(`\\b${name}\\s*\\(`, "gi"), `Math.${name}(`);
  }
  result = result.replace(/\^/g, "**");
  return result;
}

/** Identifiers left after substitution that are not allowed DSL functions. */
export function collectUnresolvedSymbols(expression: string): string[] {
  const tokens = expression.match(/\b[A-Za-z_]\w*\b/g) ?? [];
  const unresolved = new Set<string>();
  for (const token of tokens) {
    if (DSL_FUNCTION_NAMES.has(token.toLowerCase())) {
      continue;
    }
    unresolved.add(token);
  }
  return [...unresolved].sort();
}

/** Best-effort numeric evaluation for admin sandbox (validated DSL only). */
export function evaluateFormulaSandbox(
  expression: string,
  bindings: Record<string, number>,
): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = expression.trim();
  if (!trimmed) {
    return { ok: false, error: "Expression is empty" };
  }

  let substituted = trimmed;
  const aliases = Object.keys(bindings).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    const value = bindings[alias];
    if (value === undefined || Number.isNaN(value)) {
      return { ok: false, error: `Missing numeric value for "${alias}"` };
    }
    substituted = substituted.replace(
      new RegExp(`\\b${escapeRegExp(alias)}\\b`, "g"),
      `(${value})`,
    );
  }

  const unresolved = collectUnresolvedSymbols(substituted);
  if (unresolved.length > 0) {
    return {
      ok: false,
      error: `Unresolved symbols: ${unresolved.join(", ")}. Add them in Step 2 (Parameters).`,
    };
  }

  const mathExpr = applyMathFunctions(substituted);

  try {
    const value = Function(`"use strict"; return (${mathExpr});`)() as unknown;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return { ok: false, error: "Result is not a finite number" };
    }
    return { ok: true, value };
  } catch {
    return { ok: false, error: "Could not evaluate — check syntax and values" };
  }
}
