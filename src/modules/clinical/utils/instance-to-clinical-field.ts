import { FIELD_PROTECTION_LEVEL } from "@/config/field-protection";
import {
  RENDERER_FIELD_TYPES,
  type RendererFieldType,
  type ScientificDataType,
} from "@/renderer/types/field-types";
import { normalizeFieldType } from "@/renderer/field-metadata.registry";
import type { FieldDefinition } from "@/renderer/types";
import type { ClinicalIntakeInput } from "@/types/clinical-intake";

function humanizeOptionLabel(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function mapAllowedValues(
  allowed: unknown,
): Array<{ value: string; label: string }> | undefined {
  if (!Array.isArray(allowed) || allowed.length === 0) {
    return undefined;
  }

  return allowed.map((entry) => {
    if (entry && typeof entry === "object" && "value" in entry) {
      const row = entry as { value: unknown; label?: unknown };
      const value = String(row.value);
      const label =
        typeof row.label === "string" && row.label.trim()
          ? row.label
          : humanizeOptionLabel(value);
      return { value, label };
    }

    const value = String(entry);
    return { value, label: humanizeOptionLabel(value) };
  });
}

function fieldTypeFromUiConfig(uiConfig: unknown): RendererFieldType | null {
  if (!uiConfig || typeof uiConfig !== "object") {
    return null;
  }

  const candidate = (uiConfig as { fieldType?: unknown }).fieldType;
  if (typeof candidate !== "string") {
    return null;
  }

  const normalized = normalizeFieldType(candidate);
  return RENDERER_FIELD_TYPES.includes(normalized) ? normalized : null;
}

function resolveRendererFieldType(input: ClinicalIntakeInput): RendererFieldType {
  const fromUi = fieldTypeFromUiConfig(input.uiConfig);
  if (fromUi) {
    return fromUi;
  }

  const options = mapAllowedValues(input.allowedValues);
  if (options?.length) {
    return "select";
  }

  switch (input.dataTypeCode) {
    case "number":
      return "number";
    case "boolean":
      return "checkbox";
    case "enum":
      return "select";
    case "date":
      return "date";
    default:
      return "text";
  }
}

function resolveScientificDataType(
  dataTypeCode: string,
): ScientificDataType | undefined {
  const normalized = dataTypeCode.toLowerCase();
  if (
    normalized === "string" ||
    normalized === "number" ||
    normalized === "boolean" ||
    normalized === "enum" ||
    normalized === "date" ||
    normalized === "json" ||
    normalized === "array"
  ) {
    return normalized;
  }
  return undefined;
}

/** Prefer concise clinician labels (e.g. "HbA1c" over "Glycated Hemoglobin (HbA1c)"). */
function buildFieldLabel(input: ClinicalIntakeInput): string {
  const raw =
    input.label?.trim() ||
    humanizeOptionLabel(input.factorSlug.replace(/^sg-/, ""));

  const paren = raw.match(/\(([^)]+)\)\s*$/);
  if (paren?.[1] && paren[1].length <= raw.length - 3) {
    return paren[1].trim();
  }

  return raw;
}

/** Map a resolved factor instance row to a metadata-driven field for clinical intake. */
export function instanceToClinicalField(
  input: ClinicalIntakeInput,
): FieldDefinition {
  const validations =
    input.validations && typeof input.validations === "object"
      ? (input.validations as Record<string, unknown>)
      : undefined;
  const options =
    mapAllowedValues(input.allowedValues) ??
    mapAllowedValues(validations?.options);

  const unitShort = input.unitCode?.trim() || null;
  const config: FieldDefinition["config"] = {};
  if (unitShort) {
    config.unit = unitShort;
  }
  if (options?.length) {
    config.options = options;
  }

  const label = buildFieldLabel(input);

  return {
    id: input.alias,
    fieldType: resolveRendererFieldType(input),
    dataType: resolveScientificDataType(input.dataTypeCode),
    protection: FIELD_PROTECTION_LEVEL.CUSTOM,
    label,
    placeholder: unitShort ? `Enter ${unitShort}` : undefined,
    required: input.required || input.runtimeRequired,
    defaultValue: input.defaultValue ?? undefined,
    validations,
    config: Object.keys(config).length > 0 ? config : undefined,
    options,
  };
}
