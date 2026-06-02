import type { ClinicalIntakeInput } from "@/types/clinical-intake";

export type CoercedRuntimeInputs = {
  bindings: Record<string, number>;
  missingLabels: string[];
};

/** Map clinical form values to execute API bindings (runtime-required aliases only). */
export function coerceRuntimeInputs(
  inputs: ClinicalIntakeInput[],
  values: Record<string, unknown>,
): CoercedRuntimeInputs {
  const bindings: Record<string, number> = {};
  const missingLabels: string[] = [];

  for (const input of inputs) {
    if (!input.runtimeRequired) {
      continue;
    }

    const label = input.label?.trim() || input.alias;
    const raw = values[input.alias];

    if (raw === undefined || raw === null || raw === "") {
      missingLabels.push(label);
      continue;
    }

    const numeric =
      typeof raw === "number" ? raw : Number(String(raw).trim());

    if (Number.isNaN(numeric)) {
      missingLabels.push(label);
      continue;
    }

    bindings[input.alias] = numeric;
  }

  return { bindings, missingLabels };
}
