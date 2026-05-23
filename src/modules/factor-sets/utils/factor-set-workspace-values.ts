import { normalizeFieldType } from "@/renderer/field-metadata.registry";
import type { FieldDefinition } from "@/renderer/types";
import type { FactorSet } from "@/types/factor-set";
import { isCoreFactorSetField } from "./factor-set-core-fields";

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

function customFieldValueToForm(value: unknown): unknown {
  if (value === null || value === undefined) {
    return "";
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return value;
}

function entityValueToForm(fieldId: string, raw: unknown): unknown {
  if (raw === null || raw === undefined) {
    return "";
  }
  if (fieldId === "tags" && Array.isArray(raw)) {
    return raw.join(", ");
  }
  if (Array.isArray(raw)) {
    return raw.join(", ");
  }
  return raw;
}

function fieldStorageKey(
  fieldId: string,
  def: FieldDefinition,
): string {
  return def.id ?? fieldId;
}

export function factorSetToFormValues(
  factorSet: FactorSet,
  fields: Record<string, FieldDefinition>,
): Record<string, unknown> {
  const values = emptyFormValues(fields);
  const customByKey = new Map(
    (factorSet.customFields ?? []).map((field) => [field.key, field.value]),
  );

  for (const [fieldId, def] of Object.entries(fields)) {
    const storageKey = fieldStorageKey(fieldId, def);

    if (isCoreFactorSetField(fieldId)) {
      const raw = factorSet[fieldId as keyof FactorSet];
      if (raw !== undefined) {
        values[fieldId] = entityValueToForm(fieldId, raw);
      }
      continue;
    }

    if (customByKey.has(storageKey)) {
      values[fieldId] = customFieldValueToForm(customByKey.get(storageKey));
    } else if (customByKey.has(fieldId)) {
      values[fieldId] = customFieldValueToForm(customByKey.get(fieldId));
    }
  }

  return values;
}

function parseCommaList(raw: unknown): string[] | undefined {
  const items = String(raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function serializeCustomValue(
  raw: unknown,
  fieldType: ReturnType<typeof normalizeFieldType>,
): unknown {
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }
  if (fieldType === "checkbox") {
    return Boolean(raw);
  }
  if (
    fieldType === "lookup" ||
    fieldType === "text" ||
    fieldType === "textarea"
  ) {
    return String(raw).trim();
  }
  return raw;
}

/** Map workspace form values to factor set API body (core columns + customFields). */
export function valuesToFactorSetPayload(
  values: Record<string, unknown>,
  fields: Record<string, FieldDefinition>,
  options?: { isUpdate?: boolean },
): Record<string, unknown> {
  const isUpdate = options?.isUpdate === true;
  const payload: Record<string, unknown> = {};
  const customFields: Array<{
    key: string;
    label: string;
    value: unknown;
    dataType: string;
  }> = [];

  for (const [fieldId, def] of Object.entries(fields)) {
    const raw = values[fieldId];
    const type = normalizeFieldType(def.fieldType);
    const storageKey = fieldStorageKey(fieldId, def);

    if (!isCoreFactorSetField(fieldId)) {
      const value = serializeCustomValue(raw, type);
      if (!isUpdate && (value === null || value === "")) {
        continue;
      }
      customFields.push({
        key: storageKey,
        label: def.label,
        value,
        dataType: def.dataType ?? "string",
      });
      continue;
    }

    if (raw === undefined || raw === null || raw === "") {
      continue;
    }

    if (type === "checkbox") {
      payload[fieldId] = Boolean(raw);
      continue;
    }

    if (fieldId === "tags") {
      const parsed = parseCommaList(raw);
      if (parsed) {
        payload[fieldId] = parsed;
      }
      continue;
    }

    if (type === "textarea" || type === "text" || type === "lookup") {
      const text = String(raw).trim();
      if (text) {
        payload[fieldId] = text;
      }
    }
  }

  if (customFields.length > 0 || isUpdate) {
    payload.customFields = customFields;
  }

  return payload;
}
