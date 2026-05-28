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

export type SimulationParseResponse = {
  status: "VALID" | "BROKEN";
  frameworkVersion?: string;
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

export async function parseFormulaPreview(input: {
  framework: string;
  expression: string;
  knownVariables: SimulationKnownVariable[];
  frameworkVersion?: string;
  manualMode?: boolean;
}): Promise<SimulationParseResponse> {
  const response = await fetch(
    `${env.NEXT_PUBLIC_SIMULATION_URL}/api/v1/formula/parse`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    throw new Error(`Simulation parse failed (HTTP ${response.status})`);
  }

  return (await response.json()) as SimulationParseResponse;
}

export async function listSimulationFrameworks(): Promise<
  SimulationFrameworkMetadata[]
> {
  const response = await fetch(`${env.NEXT_PUBLIC_SIMULATION_URL}/api/v1/frameworks`);
  if (!response.ok) {
    throw new Error(`Framework list failed (HTTP ${response.status})`);
  }
  return (await response.json()) as SimulationFrameworkMetadata[];
}
