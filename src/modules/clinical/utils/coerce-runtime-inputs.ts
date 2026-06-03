import type { ClinicalIntakeInput } from "@/types/clinical-intake";

export type RuntimeInputBinding = string | number | boolean;

export type CoercedRuntimeInputs = {
  bindings: Record<string, RuntimeInputBinding>;
  missingLabels: string[];
};

function isEnumLikeDataType(dataTypeCode: string): boolean {
  const normalized = dataTypeCode.toLowerCase();
  return normalized === "enum" || normalized === "categorical";
}

function coerceOptionalBinding(
  input: ClinicalIntakeInput,
  raw: unknown,
): RuntimeInputBinding | null {
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }

  if (isEnumLikeDataType(input.dataTypeCode)) {
    return String(raw).trim();
  }

  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }

  if (typeof raw === "boolean") {
    return raw;
  }

  const numeric = Number(String(raw).trim());
  if (Number.isFinite(numeric)) {
    return numeric;
  }

  return String(raw).trim();
}

/** Map clinical form values to execute API bindings (runtime + enum inputs for mapping). */
export function coerceRuntimeInputs(
  inputs: ClinicalIntakeInput[],
  values: Record<string, unknown>,
): CoercedRuntimeInputs {
  const bindings: Record<string, RuntimeInputBinding> = {};
  const missingLabels: string[] = [];

  for (const input of inputs) {
    const label = input.label?.trim() || input.alias;
    const raw = values[input.alias];
    const optionalBinding = coerceOptionalBinding(input, raw);

    if (!input.runtimeRequired) {
      if (optionalBinding !== null) {
        bindings[input.alias] = optionalBinding;
      }
      continue;
    }

    if (optionalBinding === null) {
      missingLabels.push(label);
      continue;
    }

    if (
      !isEnumLikeDataType(input.dataTypeCode) &&
      typeof optionalBinding === "string"
    ) {
      const numeric = Number(optionalBinding);
      if (!Number.isFinite(numeric)) {
        missingLabels.push(label);
        continue;
      }
      bindings[input.alias] = numeric;
      continue;
    }

    bindings[input.alias] = optionalBinding;
  }

  return { bindings, missingLabels };
}
