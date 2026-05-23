import { normalizeFieldType } from "@/renderer/field-metadata.registry";
import type { FieldDefinition } from "@/renderer/types";
import type { EntityRecordDto } from "@/types/entity-record";

export function emptyRecordFormValues(
  fields: Record<string, FieldDefinition>,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [id, def] of Object.entries(fields)) {
    const type = normalizeFieldType(def.fieldType);
    if (type === "checkbox") {
      values[id] = def.config?.checkedByDefault ?? false;
    } else {
      values[id] = "";
    }
  }
  return values;
}

export function recordToFormValues(
  record: EntityRecordDto,
  fields: Record<string, FieldDefinition>,
): Record<string, unknown> {
  const values = emptyRecordFormValues(fields);
  for (const fieldId of Object.keys(fields)) {
    if (fieldId in record.values) {
      values[fieldId] = record.values[fieldId];
    }
  }
  return values;
}

/** Flat payload for entity record APIs. */
export function valuesToRecordPayload(
  values: Record<string, unknown>,
  fields: Record<string, FieldDefinition>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const fieldId of Object.keys(fields)) {
    if (!Object.prototype.hasOwnProperty.call(values, fieldId)) {
      continue;
    }
    const raw = values[fieldId];
    if (raw === "" || raw === undefined || raw === null) {
      continue;
    }
    payload[fieldId] = raw;
  }

  return payload;
}
