import {
  coerceValidationsForSubmit,
  validationFieldTypesForDataType,
} from "@/lib/lookup-metadata";
import { rendererFieldIdMatchesKey, toRendererFieldId } from "@/renderer/utils/field-keys";
import { normalizeFieldType } from "@/renderer/field-metadata.registry";
import type { FieldDefinition, FormDefinitionPayload } from "@/renderer/types";
import type { Factor, FactorListItem } from "@/types/factor";
import { isCoreFactorField } from "./factor-core-fields";
import { listRegistryTableFieldIds } from "./factor-registry-layout";

export {
  listRegistryFilterFieldIds,
  listRegistryTableFieldIds,
  orderedWorkspaceFieldIds,
  isRegistryCustomField,
} from "./factor-registry-layout";

export type FactorListColumn = {
  fieldId: string;
  label: string;
  kind: "text" | "lookup" | "badge" | "boolean";
};

export function buildFactorListColumns(
  definition: FormDefinitionPayload | undefined,
): FactorListColumn[] {
  const fields = definition?.fields ?? {};

  return listRegistryTableFieldIds(definition).map((fieldId) => {
    const def = fields[fieldId]!;
    const type = normalizeFieldType(def.fieldType);
    let kind: FactorListColumn["kind"] = "text";
    if (type === "lookup") {
      kind = def.config?.registryBadge ? "badge" : "lookup";
    } else if (type === "checkbox") {
      kind = "boolean";
    }
    return {
      fieldId,
      label: def.label ?? fieldId,
      kind,
    };
  });
}

export function getRegistryCellValue(
  factor: FactorListItem,
  fieldId: string,
): unknown {
  if (isCoreFactorField(fieldId)) {
    return factor[fieldId as keyof FactorListItem];
  }
  const custom = factor.customValues;
  if (!custom) {
    return undefined;
  }
  if (fieldId in custom) {
    return custom[fieldId];
  }
  const match = Object.keys(custom).find(
    (key) => key.toLowerCase() === fieldId.toLowerCase(),
  );
  return match ? custom[match] : undefined;
}

export function emptyFormValues(
  fields: Record<string, FieldDefinition>,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [id, def] of Object.entries(fields)) {
    const type = normalizeFieldType(def.fieldType);
    if (type === "checkbox") {
      values[id] = def.config?.checkedByDefault ?? false;
    } else if (type === "dynamic-validations") {
      values[id] = {};
    } else if (def.config?.defaultValue !== undefined) {
      values[id] = def.config.defaultValue;
    } else {
      values[id] = "";
    }
  }
  return values;
}

function entityValueToForm(fieldId: string, raw: unknown): unknown {
  if (raw === null || raw === undefined) {
    return fieldId === "validations" ? {} : "";
  }
  if (fieldId === "validations" && typeof raw === "object") {
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(", ") : value,
      ]),
    );
  }
  if (Array.isArray(raw)) {
    return raw.join(", ");
  }
  return raw;
}

function customFieldValueToForm(value: unknown): unknown {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return value;
}

export function factorToFormValues(
  factor: Factor,
  fields: Record<string, FieldDefinition>,
): Record<string, unknown> {
  const values = emptyFormValues(fields);
  const customByKey = new Map(
    factor.customFields?.map((field) => [field.key, field.value]) ?? [],
  );

  for (const [fieldId, def] of Object.entries(fields)) {
    const storageKey = fieldStorageKey(fieldId, def);
    if (isCoreFactorField(fieldId)) {
      const raw = factor[fieldId as keyof Factor];
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

export function resolveFieldIdByKey(
  fields: Record<string, FieldDefinition>,
  fieldKey: string,
): string | undefined {
  const direct = toRendererFieldId(fieldKey);
  if (fields[direct]) {
    return direct;
  }
  return Object.keys(fields).find((id) => rendererFieldIdMatchesKey(id, fieldKey));
}

export function resolveDataTypeFieldId(
  fields: Record<string, FieldDefinition>,
): string | undefined {
  const dependent = Object.values(fields).find((f) => f.dynamicRequiredFrom);
  if (dependent?.dynamicRequiredFrom) {
    return dependent.dynamicRequiredFrom;
  }

  const dynamicValidations = Object.values(fields).find(
    (f) => normalizeFieldType(f.fieldType) === "dynamic-validations",
  );
  if (dynamicValidations?.visibility?.dependsOn) {
    return dynamicValidations.visibility.dependsOn;
  }

  return Object.keys(fields).find(
    (id) =>
      normalizeFieldType(fields[id]?.fieldType) === "lookup" &&
      id.toLowerCase().includes("datatype"),
  );
}

export function resolveUnitFieldId(
  fields: Record<string, FieldDefinition>,
): string | undefined {
  return Object.entries(fields).find(([, f]) => f.dynamicRequiredFrom)?.[0];
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

function fieldStorageKey(
  fieldId: string,
  def: FieldDefinition,
): string {
  return def.id ?? fieldId;
}

/** Map workspace form values to factor API body (core columns + customFields). */
export function valuesToFactorPayload(
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

    if (!isCoreFactorField(fieldId)) {
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

    if (type === "dynamic-validations") {
      const dataTypeFieldId = resolveDataTypeFieldId(fields);
      const dataTypeCode = dataTypeFieldId
        ? String(values[dataTypeFieldId] ?? "").trim()
        : "";
      const validations = coerceValidationsForSubmit(
        (raw as Record<string, unknown>) ?? {},
        validationFieldTypesForDataType(dataTypeCode),
      );
      if (Object.keys(validations).length > 0) {
        payload.validations = validations;
      }
      continue;
    }

    if (fieldId === "tags" || fieldId === "aliases" || fieldId === "allowedValues") {
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
