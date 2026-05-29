import { normalizeFieldType } from "@/renderer/field-metadata.registry";
import type { FieldDefinition } from "@/renderer/types";
import type { OutcomeDefinitionDto } from "@/types/formula";
import { isCoreOutcomeField } from "./outcome-core-fields";

export function emptyFormValues(
  fields: Record<string, FieldDefinition>,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [fieldId, def] of Object.entries(fields)) {
    const type = normalizeFieldType(def.fieldType);
    if (type === "checkbox") {
      values[fieldId] = def.config?.checkedByDefault ?? false;
    } else if (def.config?.defaultValue !== undefined) {
      values[fieldId] = def.config.defaultValue;
    } else {
      values[fieldId] = "";
    }
  }
  return values;
}

export function outcomeToFormValues(
  outcome: OutcomeDefinitionDto,
  fields: Record<string, FieldDefinition>,
): Record<string, unknown> {
  const values = emptyFormValues(fields);

  for (const fieldId of Object.keys(fields)) {
    if (!isCoreOutcomeField(fieldId)) {
      continue;
    }
    const raw = outcome[fieldId as keyof OutcomeDefinitionDto];
    if (raw !== undefined && raw !== null) {
      values[fieldId] = String(raw);
    }
  }

  return values;
}

export type OutcomeCreatePayload = {
  slug: string;
  displayName: string;
  description?: string;
  unitCode?: string;
};

export type OutcomeUpdatePayload = {
  displayName: string;
  description?: string | null;
  unitCode?: string | null;
};

function readTrimmedString(values: Record<string, unknown>, fieldId: string): string {
  const raw = values[fieldId];
  if (raw === undefined || raw === null) {
    return "";
  }
  return String(raw).trim();
}

export function valuesToCreatePayload(
  values: Record<string, unknown>,
  _fields: Record<string, FieldDefinition>,
): OutcomeCreatePayload {
  const slug = readTrimmedString(values, "slug");
  const displayName = readTrimmedString(values, "displayName");
  const unitCode = readTrimmedString(values, "unitCode");
  const description = readTrimmedString(values, "description");

  if (!slug || !displayName) {
    throw new Error("Display name and slug are required.");
  }

  return {
    slug,
    displayName,
    unitCode: unitCode || undefined,
    description: description || undefined,
  };
}

export function valuesToUpdatePayload(
  values: Record<string, unknown>,
  _fields: Record<string, FieldDefinition>,
): OutcomeUpdatePayload {
  const displayName = readTrimmedString(values, "displayName");
  if (!displayName) {
    throw new Error("Display name is required.");
  }

  const unitCode = readTrimmedString(values, "unitCode");
  const description = readTrimmedString(values, "description");

  return {
    displayName,
    unitCode: unitCode || null,
    description: description || null,
  };
}
