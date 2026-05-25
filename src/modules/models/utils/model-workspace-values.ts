import type { FieldDefinition, FormDefinitionPayload } from "@/renderer/types";
import type {
  CreateModelPayload,
  ModelDto,
  UpdateModelPayload,
} from "@/types/model";
import { isModelSystemFieldKey } from "./model-core-fields";

export type ModelFormValues = {
  drugId: string;
  name: string;
  displayName: string;
  description: string;
  frameworkType: string;
  statusCode: string;
  custom: Record<string, unknown>;
};

function customValueToStored(value: unknown): unknown {
  if (value === "" || value === undefined) {
    return null;
  }
  return value;
}

function isCustomWorkspaceField(fieldId: string, def: FieldDefinition): boolean {
  return !isModelSystemFieldKey(fieldId) && !isModelSystemFieldKey(def.id);
}

export function emptyCustomValues(
  fields: Record<string, FieldDefinition>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [fieldId, def] of Object.entries(fields)) {
    if (!isCustomWorkspaceField(fieldId, def)) {
      continue;
    }
    out[fieldId] = "";
  }
  return out;
}

export function modelToFormValues(
  model: ModelDto,
  fields: Record<string, FieldDefinition>,
): ModelFormValues {
  const custom = emptyCustomValues(fields);
  const stored = model.customValues ?? {};

  for (const [fieldId, def] of Object.entries(fields)) {
    if (!isCustomWorkspaceField(fieldId, def)) {
      continue;
    }
    if (fieldId in stored) {
      custom[fieldId] = stored[fieldId];
    } else if (def.id in stored) {
      custom[fieldId] = stored[def.id];
    }
  }

  return {
    drugId: model.drugId,
    name: model.name,
    displayName: model.displayName,
    description: model.description ?? "",
    frameworkType: model.frameworkType ?? "",
    statusCode: model.statusCode,
    custom,
  };
}

export function customValuesFromForm(
  custom: Record<string, unknown>,
  fields: Record<string, FieldDefinition>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [fieldId, def] of Object.entries(fields)) {
    if (!isCustomWorkspaceField(fieldId, def)) {
      continue;
    }
    if (!(fieldId in custom)) {
      continue;
    }
    out[fieldId] = customValueToStored(custom[fieldId]);
  }
  return out;
}

export function valuesToCreatePayload(
  values: ModelFormValues,
  fields: Record<string, FieldDefinition>,
): CreateModelPayload {
  return {
    drugId: values.drugId,
    name: values.name.trim(),
    displayName: values.displayName.trim(),
    description: values.description.trim() || undefined,
    frameworkType: values.frameworkType.trim() || undefined,
    statusCode: values.statusCode,
    customValues: customValuesFromForm(values.custom, fields),
  };
}

export function valuesToUpdatePayload(
  values: ModelFormValues,
  fields: Record<string, FieldDefinition>,
  expectedVersion: number,
): UpdateModelPayload {
  return {
    name: values.name.trim(),
    displayName: values.displayName.trim(),
    description: values.description.trim() || undefined,
    frameworkType: values.frameworkType.trim() || undefined,
    statusCode: values.statusCode,
    customValues: customValuesFromForm(values.custom, fields),
    expectedVersion,
  };
}

export function hasCustomWorkspaceFields(
  definition: FormDefinitionPayload | undefined,
): boolean {
  if (!definition?.fields) {
    return false;
  }
  return Object.entries(definition.fields).some(([fieldId, def]) =>
    isCustomWorkspaceField(fieldId, def),
  );
}
