import type { FormulaParameterInput } from "@/types/formula";
import type {
  SimulationDependencySummary,
  SimulationKnownParameter,
  SimulationKnownVariable,
} from "@/services/simulation-formula.service";

export function dtoToParameterInput(
  parameters: Array<{
    alias: string;
    type: "DYNAMIC" | "STATIC";
    sourceType?: "FACTOR_INSTANCE" | "DERIVED_FACTOR" | null;
    instanceId?: string | null;
    derivedFactorId?: string | null;
    defaultValue?: number | null;
    label?: string | null;
    sortOrder?: number;
  }>,
): FormulaParameterInput[] {
  return parameters.map((param, index) => ({
    alias: param.alias,
    type: param.type,
    sourceType: param.sourceType ?? undefined,
    instanceId: param.instanceId ?? undefined,
    derivedFactorId: param.derivedFactorId ?? undefined,
    defaultValue: param.defaultValue ?? undefined,
    label: param.label ?? undefined,
    sortOrder: param.sortOrder ?? index,
  }));
}

export function parametersToSimulationPayload(parameters: FormulaParameterInput[]): {
  knownVariables: SimulationKnownVariable[];
  knownParameters: SimulationKnownParameter[];
} {
  const knownVariables: SimulationKnownVariable[] = [];
  const knownParameters: SimulationKnownParameter[] = [];

  for (const param of parameters) {
    if (param.type === "DYNAMIC") {
      const sourceType = param.sourceType ?? "FACTOR_INSTANCE";
      const entry: SimulationKnownParameter = {
        alias: param.alias,
        type: "DYNAMIC",
      };
      if (sourceType === "FACTOR_INSTANCE" && param.instanceId) {
        entry.instanceId = param.instanceId;
        knownVariables.push({ alias: param.alias, instanceId: param.instanceId });
      } else if (sourceType === "DERIVED_FACTOR" && param.derivedFactorId) {
        entry.instanceId = param.derivedFactorId;
      }
      knownParameters.push(entry);
    } else {
      knownParameters.push({
        alias: param.alias,
        type: "STATIC",
        defaultValue: param.defaultValue,
      });
    }
  }

  return { knownVariables, knownParameters };
}

/** Client-side fallback when parse API omits dependencySummary. */
export function classifyFormulaDependencies(
  usedAliases: string[],
  parameters: FormulaParameterInput[],
): SimulationDependencySummary {
  const paramByAlias = new Map(parameters.map((param) => [param.alias, param]));
  const used = [...new Set(usedAliases.filter(Boolean))].sort();

  const usedDynamic: string[] = [];
  const usedStatic: string[] = [];
  const undeclared: string[] = [];

  for (const alias of used) {
    const param = paramByAlias.get(alias);
    if (!param) {
      undeclared.push(alias);
    } else if (param.type === "STATIC") {
      usedStatic.push(alias);
    } else {
      usedDynamic.push(alias);
    }
  }

  const unusedDeclared = parameters
    .map((param) => param.alias)
    .filter((alias) => !used.includes(alias))
    .sort();

  return { usedDynamic, usedStatic, undeclared, unusedDeclared };
}
