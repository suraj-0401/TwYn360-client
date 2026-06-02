/** Must stay aligned with simulation-service `app/formulas/safe_functions.py`. */

export const FORMULA_DSL_OPERATORS = ["+", "-", "*", "/", "^", "(", ")"] as const;

export const FORMULA_DSL_FUNCTIONS = [
  "sqrt",
  "log",
  "exp",
  "abs",
  "min",
  "max",
  "round",
  "floor",
  "ceil",
  "pow",
] as const;

export type FormulaDslFunction = (typeof FORMULA_DSL_FUNCTIONS)[number];

export const FORMULA_TOOLBAR_GROUPS: Array<{
  label: string;
  tokens: string[];
}> = [
  { label: "Arithmetic", tokens: ["+", "-", "*", "/", "^", "(", ")"] },
  { label: "Basic", tokens: ["sqrt()", "abs()", "round()"] },
  { label: "Scientific", tokens: ["log()", "exp()", "pow()"] },
  { label: "Logic", tokens: ["min()", "max()", "floor()", "ceil()"] },
];
