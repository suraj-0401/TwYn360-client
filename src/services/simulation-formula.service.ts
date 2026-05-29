import { env } from "@/config/env";

export type SimulationKnownVariable = {
  alias: string;
  instanceId: string;
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
  frameworkVersion?: string | null;
  dependencies?: SimulationKnownVariable[];
  errors?: SimulationValidationError[];
};

export type SimulationFrameworkMetadata = {
  framework: string;
  defaultVersion: string;
  supportedVersions: string[];
  capabilities: {
    supportsFunctions: boolean;
    supportsPower: boolean;
    supportsDivision: boolean;
    supportsDifferential: boolean;
  };
};

type EditorMode = "monaco" | "mathlive";

function simulationBaseUrl(): string {
  return env.NEXT_PUBLIC_SIMULATION_URL.replace(/\/$/, "");
}

export async function normalizeFormulaPreview(input: {
  expression: string;
  knownAliases?: string[];
  editorMode?: EditorMode;
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
  framework?: string | null;
  expression: string;
  knownVariables: SimulationKnownVariable[];
  frameworkVersion?: string;
  manualMode?: boolean;
}): Promise<SimulationParseResponse> {
  const body: Record<string, unknown> = {
    expression: input.expression,
    knownVariables: input.knownVariables,
    manualMode: input.manualMode ?? false,
  };

  if (input.framework) {
    body.framework = input.framework;
    if (input.frameworkVersion) {
      body.frameworkVersion = input.frameworkVersion;
    }
  }

  const response = await fetch(`${simulationBaseUrl()}/api/v1/formula/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Simulation parse failed (HTTP ${response.status})`);
  }

  return (await response.json()) as SimulationParseResponse;
}

export async function listSimulationFrameworks(): Promise<
  SimulationFrameworkMetadata[]
> {
  const response = await fetch(`${simulationBaseUrl()}/api/v1/frameworks`);
  if (!response.ok) {
    throw new Error(`Framework list failed (HTTP ${response.status})`);
  }
  return (await response.json()) as SimulationFrameworkMetadata[];
}
