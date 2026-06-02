import { env } from "@/config/env";

export type SimulationKnownVariable = {
  alias: string;
  instanceId: string;
};

export type SimulationKnownParameter = {
  alias: string;
  type: "DYNAMIC" | "STATIC";
  instanceId?: string;
  defaultValue?: number;
};

export type SimulationDependencySummary = {
  usedDynamic: string[];
  usedStatic: string[];
  undeclared: string[];
  unusedDeclared: string[];
};

export type SimulationValidationError = {
  type: string;
  message: string;
  severity?: string;
  startIndex?: number;
  endIndex?: number;
  suggestions?: string[];
  alias?: string;
  instanceId?: string;
};

export type SimulationParseMetadata = {
  variables: string[];
  functions: string[];
  operators: string[];
};

export type SimulationNormalizeResponse = {
  normalizedExpression: string;
  canonicalExpression: string;
  parseMetadata: SimulationParseMetadata;
  diagnostics?: SimulationValidationError[];
};

export type SimulationParseResponse = {
  status: "VALID" | "BROKEN";
  dependencies?: SimulationKnownVariable[];
  dependencySummary?: SimulationDependencySummary;
  errors?: SimulationValidationError[];
};

function simulationBaseUrl(): string {
  return env.NEXT_PUBLIC_SIMULATION_URL.replace(/\/$/, "");
}

export async function normalizeFormulaPreview(input: {
  expression: string;
  knownAliases?: string[];
  knownParameters?: SimulationKnownParameter[];
}): Promise<SimulationNormalizeResponse> {
  const response = await fetch(`${simulationBaseUrl()}/api/v1/formula/normalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Simulation normalize failed (HTTP ${response.status})`);
  }

  return (await response.json()) as SimulationNormalizeResponse;
}

export async function parseFormulaPreview(input: {
  expression: string;
  knownVariables?: SimulationKnownVariable[];
  knownParameters?: SimulationKnownParameter[];
  manualMode?: boolean;
}): Promise<SimulationParseResponse> {
  const response = await fetch(`${simulationBaseUrl()}/api/v1/formula/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      expression: input.expression,
      knownVariables: input.knownVariables ?? [],
      knownParameters: input.knownParameters ?? [],
      manualMode: input.manualMode ?? false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Simulation parse failed (HTTP ${response.status})`);
  }

  return (await response.json()) as SimulationParseResponse;
}
