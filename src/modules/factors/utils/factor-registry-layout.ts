import { normalizeFieldType } from "@/renderer/field-metadata.registry";
import type { FieldDefinition, FormDefinitionPayload } from "@/renderer/types";
import { isCoreFactorField } from "./factor-core-fields";

/** Never show internal identifier in the registry table. */
const REGISTRY_LIST_EXCLUDED = new Set(["name", "slug"]);

export function readRegistryListFlag(
  fieldId: string,
  def: FieldDefinition,
): boolean {
  if (REGISTRY_LIST_EXCLUDED.has(fieldId)) {
    return false;
  }
  return def.config?.registryList === true;
}

export function readRegistryFilterFlag(def: FieldDefinition): boolean {
  if (normalizeFieldType(def.fieldType) !== "lookup") {
    return false;
  }
  return def.config?.registryFilter === true;
}

export function orderedWorkspaceFieldIds(
  definition: FormDefinitionPayload | undefined,
): string[] {
  if (!definition?.form.sections) {
    return [];
  }
  return definition.form.sections.flatMap((section) => section.fields);
}

export function listRegistryTableFieldIds(
  definition: FormDefinitionPayload | undefined,
): string[] {
  const fields = definition?.fields ?? {};
  const order = orderedWorkspaceFieldIds(definition);
  const seen = new Set<string>();
  const ids: string[] = [];

  const add = (fieldId: string) => {
    if (seen.has(fieldId)) {
      return;
    }
    const def = fields[fieldId];
    if (!def || !readRegistryListFlag(fieldId, def)) {
      return;
    }
    ids.push(fieldId);
    seen.add(fieldId);
  };

  for (const fieldId of order) {
    add(fieldId);
  }
  for (const fieldId of Object.keys(fields)) {
    add(fieldId);
  }

  return ids;
}

export function listRegistryFilterFieldIds(
  definition: FormDefinitionPayload | undefined,
): string[] {
  const fields = definition?.fields ?? {};
  return orderedWorkspaceFieldIds(definition).filter((fieldId) => {
    const def = fields[fieldId];
    return def ? readRegistryFilterFlag(def) : false;
  });
}

export function isRegistryCustomField(fieldId: string): boolean {
  return !isCoreFactorField(fieldId);
}
