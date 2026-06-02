import type { SimulationDependencySummary } from "@/services/simulation-formula.service";
import type { FormulaParameterInput } from "@/types/formula";

export type ScientificDiagnostic = {
  id: string;
  level: "ok" | "warning" | "error";
  message: string;
};

export function buildScientificDiagnostics(input: {
  expression: string;
  parameters: FormulaParameterInput[];
  dependencySummary: SimulationDependencySummary | null;
  sandboxBindings: Record<string, number>;
}): ScientificDiagnostic[] {
  const items: ScientificDiagnostic[] = [];
  const expr = input.expression;

  if (/\/\s*0\b/.test(expr) || /\/\s*\(\s*0\s*\)/.test(expr)) {
    items.push({
      id: "div-zero-literal",
      level: "warning",
      message: "Possible division by zero (literal 0 in denominator)",
    });
  }

  const logMatches = [...expr.matchAll(/\blog\s*\(\s*([a-zA-Z_]\w*)\s*\)/gi)];
  for (const match of logMatches) {
    const alias = match[1];
    const value = input.sandboxBindings[alias];
    if (value !== undefined && value <= 0) {
      items.push({
        id: `log-nonpositive-${alias}`,
        level: "warning",
        message: `log(${alias}) may fail — test value ${value} ≤ 0`,
      });
    }
  }

  const sqrtMatches = [...expr.matchAll(/\bsqrt\s*\(\s*([a-zA-Z_]\w*)\s*\)/gi)];
  for (const match of sqrtMatches) {
    const alias = match[1];
    const value = input.sandboxBindings[alias];
    if (value !== undefined && value < 0) {
      items.push({
        id: `sqrt-negative-${alias}`,
        level: "warning",
        message: `sqrt(${alias}) may fail — test value ${value} < 0`,
      });
    }
  }

  const summary = input.dependencySummary;
  if (summary) {
    if (summary.undeclared.length === 0) {
      items.push({
        id: "params-resolved",
        level: "ok",
        message: "All expression symbols are declared as parameters",
      });
    }
    const expressionParsed =
      summary.usedDynamic.length + summary.usedStatic.length > 0;
    if (summary.unusedDeclared.length > 0 && expressionParsed) {
      items.push({
        id: "unused-params",
        level: "warning",
        message: `Unused declared parameters: ${summary.unusedDeclared.join(", ")}`,
      });
    }
  }

  const missingDefaults = input.parameters.filter(
    (param) =>
      param.type === "STATIC" &&
      (param.defaultValue === undefined || Number.isNaN(param.defaultValue)),
  );
  if (missingDefaults.length > 0) {
    items.push({
      id: "missing-static-default",
      level: "warning",
      message: `Static parameters missing default: ${missingDefaults.map((p) => p.alias).join(", ")}`,
    });
  }

  return items;
}

export function buildValidationChecklist(input: {
  validateState: "idle" | "validating" | "valid" | "broken" | "offline";
  syntaxOk: boolean;
  parametersResolved: boolean;
  dependencySummary: SimulationDependencySummary | null;
  scientific: ScientificDiagnostic[];
}): Array<{ id: string; ok: boolean; warning?: boolean; label: string }> {
  const undeclared = input.dependencySummary?.undeclared.length ?? 0;
  return [
    {
      id: "syntax",
      ok: input.syntaxOk && input.validateState !== "broken",
      warning: input.validateState === "offline",
      label:
        input.validateState === "offline"
          ? "Syntax check offline"
          : input.syntaxOk
            ? "Syntax valid"
            : "Syntax errors present",
    },
    {
      id: "params",
      ok: input.parametersResolved && undeclared === 0,
      label:
        undeclared === 0
          ? "Parameters resolved"
          : `${undeclared} undeclared symbol(s)`,
    },
    {
      id: "units",
      ok: true,
      warning: true,
      label: "Units compatibility (manual review)",
    },
    ...input.scientific
      .filter((item) => item.level !== "ok")
      .slice(0, 2)
      .map((item) => ({
        id: item.id,
        ok: false,
        warning: item.level === "warning",
        label: item.message,
      })),
  ];
}
