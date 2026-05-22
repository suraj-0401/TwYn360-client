import type { FieldSettingsPatch } from "@/renderer/field-settings.registry";
import { normalizeLookupMetadata } from "@/renderer/lookup-field.metadata";
import type { FormDefinitionPayload, FieldDefinition } from "@/renderer/types";
import type { WorkspaceDetail } from "@/types/workspace";
import {
  rendererFieldIdMatchesKey,
  toRendererFieldId,
} from "@/renderer/utils/field-keys";

function findPayloadFieldId(
  workspace: WorkspaceDetail,
  fieldDbId: string,
): string | null {
  for (const section of workspace.sections) {
    const record = section.fields.find((f) => f.id === fieldDbId);
    if (!record) {
      continue;
    }
    const sectionDef = workspace.payload.form.sections.find(
      (s) => s.id === section.key,
    );
    if (!sectionDef) {
      continue;
    }
    const normalizedKey = toRendererFieldId(record.fieldKey);
    let scopedMatch: string | null = null;

    for (const payloadFieldId of sectionDef.fields) {
      const normalizedId = toRendererFieldId(payloadFieldId);
      if (normalizedId === normalizedKey) {
        return payloadFieldId;
      }
      if (
        rendererFieldIdMatchesKey(payloadFieldId, record.fieldKey) &&
        !scopedMatch
      ) {
        scopedMatch = payloadFieldId;
      }
    }

    if (scopedMatch) {
      return scopedMatch;
    }
  }
  return null;
}

function patchPayloadField(
  field: FieldDefinition,
  patch: FieldSettingsPatch,
): FieldDefinition {
  const next: FieldDefinition = { ...field };

  if (patch.labelOverride !== undefined) {
    next.label = patch.labelOverride;
  }
  if (patch.placeholder !== undefined) {
    next.placeholder = patch.placeholder;
  }
  if (patch.tooltip !== undefined) {
    next.tooltip = patch.tooltip;
  }
  if (patch.required !== undefined) {
    next.required = patch.required;
  }

  if (patch.config) {
    const mergedConfig = { ...(next.config ?? {}), ...patch.config };
    const lookup = normalizeLookupMetadata(patch.config.lookup);
    if (lookup) {
      next.lookup = lookup;
      next.config = { ...mergedConfig, lookup };
    } else {
      next.config = mergedConfig;
    }
    if (patch.config.tooltipEnabled === false) {
      next.tooltip = undefined;
    } else if (patch.config.tooltipEnabled === true) {
      const text = patch.tooltip ?? next.tooltip;
      next.tooltip = text?.trim() ? text.trim() : undefined;
    }
  }

  return next;
}

export function applyOptimisticFieldPatch(
  workspace: WorkspaceDetail | undefined,
  fieldDbId: string,
  patch: FieldSettingsPatch,
): WorkspaceDetail | undefined {
  if (!workspace) {
    return workspace;
  }

  const payloadFieldId = findPayloadFieldId(workspace, fieldDbId);
  if (!payloadFieldId || !workspace.payload.fields[payloadFieldId]) {
    return workspace;
  }

  const nextPayload: FormDefinitionPayload = {
    ...workspace.payload,
    fields: {
      ...workspace.payload.fields,
      [payloadFieldId]: patchPayloadField(
        workspace.payload.fields[payloadFieldId],
        patch,
      ),
    },
  };

  const nextSections = workspace.sections.map((section) => ({
    ...section,
    fields: section.fields.map((field) => {
      if (field.id !== fieldDbId) {
        return field;
      }
      const mergedConfig = {
        ...(field.config ?? {}),
        ...(patch.config ?? {}),
      };
      if (patch.config?.lookup) {
        mergedConfig.lookup = {
          ...(typeof field.config?.lookup === "object"
            ? (field.config.lookup as Record<string, unknown>)
            : {}),
          ...(patch.config.lookup as Record<string, unknown>),
        };
      }
      return {
        ...field,
        labelOverride:
          patch.labelOverride !== undefined
            ? patch.labelOverride
            : field.labelOverride,
        placeholder:
          patch.placeholder !== undefined ? patch.placeholder : field.placeholder,
        tooltip: patch.tooltip !== undefined ? patch.tooltip : field.tooltip,
        required: patch.required !== undefined ? patch.required : field.required,
        config: Object.keys(mergedConfig).length > 0 ? mergedConfig : field.config,
      };
    }),
  }));

  return {
    ...workspace,
    sections: nextSections,
    payload: nextPayload,
  };
}
