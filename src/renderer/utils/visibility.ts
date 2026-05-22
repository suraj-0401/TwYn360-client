import type { VisibilityRule } from "../types";

export function evaluateVisibility(
  rule: VisibilityRule | undefined,
  values: Record<string, unknown>,
): boolean {
  if (!rule) {
    return true;
  }

  const dependent = values[rule.dependsOn];

  switch (rule.operator) {
    case "equals":
      return dependent === rule.value;
    case "notEquals":
      return dependent !== rule.value;
    case "empty":
      return dependent === undefined || dependent === null || dependent === "";
    case "notEmpty":
      return (
        dependent !== undefined && dependent !== null && dependent !== ""
      );
    case "in":
      return (
        Array.isArray(rule.value) &&
        rule.value.some((item) => item === dependent)
      );
    default:
      return true;
  }
}
