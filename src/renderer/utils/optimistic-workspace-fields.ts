import { defaultFieldSpan } from "@/renderer/field-span";
import {
  getFieldTypeEntry,
  normalizeFieldType,
} from "@/renderer/field-metadata.registry";
import { FIELD_PROTECTION_LEVEL } from "@/config/field-protection";
import type { FieldConfig, FieldDefinition, RendererFieldType } from "@/renderer/types";
import type {
  WorkspaceDetail,
  WorkspaceFieldRecord,
} from "@/types/workspace";
import {
  allocateRendererFieldId,
  rendererFieldIdMatchesKey,
  toRendererFieldId,
} from "@/renderer/utils/field-keys";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { mergeFactorRegistryConfigDefaults } from "@/modules/factors/utils/registry-field-defaults";

export function fieldKeyFromLabel(label: string): string {
  return label
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join("");
}

function defaultConfigForFieldType(fieldType: RendererFieldType): FieldConfig {
  const normalized = normalizeFieldType(fieldType);
  const width = defaultFieldSpan(normalized);
  if (normalized === "lookup") {
    return {
      width,
      lookup: {
        collectionId: "",
        searchable: true,
        multiple: false,
        allowCreate: true,
        asyncLoading: false,
      },
    };
  }
  if (normalized === "rating") {
    return { width, minRating: 1, maxRating: 5 };
  }
  return { width };
}

export type OptimisticFieldAddResult = {
  workspace: WorkspaceDetail;
  tempFieldId: string;
  rendererFieldId: string;
  fieldKey: string;
};

export function applyOptimisticFieldAdd(
  workspace: WorkspaceDetail,
  sectionId: string,
  input: { fieldKey: string; fieldType: string; label: string },
): OptimisticFieldAddResult | null {
  const sectionRecord = workspace.sections.find((s) => s.id === sectionId);
  if (!sectionRecord) {
    return null;
  }

  const fieldKey = toRendererFieldId(input.fieldKey || "field");
  const fieldType = normalizeFieldType(input.fieldType);
  const entry = getFieldTypeEntry(fieldType);
  const usedIds = new Set(Object.keys(workspace.payload.fields));
  const rendererFieldId = allocateRendererFieldId(
    fieldKey,
    sectionRecord.key,
    usedIds,
  );
  let config = defaultConfigForFieldType(fieldType);
  if (workspace.slug === WORKSPACE_SLUGS.FACTOR_REGISTRY) {
    config = mergeFactorRegistryConfigDefaults(fieldKey, fieldType, config);
  }
  const lookup = config.lookup;

  const fieldDef: FieldDefinition = {
    id: rendererFieldId,
    fieldType,
    dataType: entry?.defaultDataType ?? "string",
    protection: FIELD_PROTECTION_LEVEL.CUSTOM,
    label: input.label,
    required: false,
    config,
    ...(lookup ? { lookup } : {}),
  };

  const tempFieldId = `pending-field-${crypto.randomUUID()}`;
  const newFieldRecord: WorkspaceFieldRecord = {
    id: tempFieldId,
    sectionId,
    fieldKey,
    factorId: null,
    fieldType,
    dataType: fieldDef.dataType ?? "string",
    config: config as Record<string, unknown>,
    uiConfig: null,
    validationsOverride: null,
    labelOverride: input.label,
    placeholder: null,
    tooltip: null,
    required: false,
    displayOrder: sectionRecord.fields.length,
  };

  const nextPayloadSections = workspace.payload.form.sections.map((section) => {
    if (section.id !== sectionRecord.key) {
      return section;
    }
    return {
      ...section,
      fields: [...section.fields, rendererFieldId],
    };
  });

  return {
    workspace: {
      ...workspace,
      sections: workspace.sections.map((section) =>
        section.id === sectionId
          ? { ...section, fields: [...section.fields, newFieldRecord] }
          : section,
      ),
      payload: {
        ...workspace.payload,
        fields: {
          ...workspace.payload.fields,
          [rendererFieldId]: fieldDef,
        },
        form: {
          ...workspace.payload.form,
          sections: nextPayloadSections,
        },
      },
    },
    tempFieldId,
    rendererFieldId,
    fieldKey,
  };
}

export function applyOptimisticFieldRemove(
  workspace: WorkspaceDetail,
  fieldDbId: string,
): WorkspaceDetail {
  let record: WorkspaceFieldRecord | undefined;
  let sectionKey: string | undefined;

  for (const section of workspace.sections) {
    const match = section.fields.find((f) => f.id === fieldDbId);
    if (match) {
      record = match;
      sectionKey = section.key;
      break;
    }
  }

  if (!record || !sectionKey) {
    return workspace;
  }

  const payloadSection = workspace.payload.form.sections.find(
    (s) => s.id === sectionKey,
  );
  const rendererFieldId = payloadSection?.fields.find((id) =>
    rendererFieldIdMatchesKey(id, record.fieldKey),
  );

  const nextFields = { ...workspace.payload.fields };
  if (rendererFieldId) {
    delete nextFields[rendererFieldId];
  }

  return {
    ...workspace,
    sections: workspace.sections.map((section) => ({
      ...section,
      fields: section.fields.filter((f) => f.id !== fieldDbId),
    })),
    payload: {
      ...workspace.payload,
      fields: nextFields,
      form: {
        ...workspace.payload.form,
        sections: workspace.payload.form.sections.map((section) =>
          section.id === sectionKey
            ? {
                ...section,
                fields: section.fields.filter((id) => id !== rendererFieldId),
              }
            : section,
        ),
      },
    },
  };
}

export function applyOptimisticFieldReorder(
  workspace: WorkspaceDetail,
  sectionId: string,
  orderedFieldIds: string[],
): WorkspaceDetail {
  const sectionRecord = workspace.sections.find((s) => s.id === sectionId);
  if (!sectionRecord) {
    return workspace;
  }

  const recordById = new Map(sectionRecord.fields.map((f) => [f.id, f]));
  const nextFields = orderedFieldIds
    .map((id, index) => {
      const field = recordById.get(id);
      return field ? { ...field, displayOrder: index } : null;
    })
    .filter((f): f is WorkspaceFieldRecord => Boolean(f));

  const idToKey = new Map(
    sectionRecord.fields.map((f) => [f.id, f.fieldKey] as const),
  );
  const payloadSection = workspace.payload.form.sections.find(
    (s) => s.id === sectionRecord.key,
  );
  if (!payloadSection) {
    return workspace;
  }

  const rendererIdByDbId = new Map<string, string>();
  for (const dbId of orderedFieldIds) {
    const fieldKey = idToKey.get(dbId);
    if (!fieldKey) {
      continue;
    }
    const rendererId = payloadSection.fields.find((id) =>
      rendererFieldIdMatchesKey(id, fieldKey),
    );
    if (rendererId) {
      rendererIdByDbId.set(dbId, rendererId);
    }
  }

  const orderedRendererIds = orderedFieldIds
    .map((id) => rendererIdByDbId.get(id))
    .filter((id): id is string => Boolean(id));

  const nextPayloadSections = workspace.payload.form.sections.map((section) =>
    section.id === sectionRecord.key
      ? { ...section, fields: orderedRendererIds }
      : section,
  );

  return {
    ...workspace,
    sections: workspace.sections.map((section) =>
      section.id === sectionId ? { ...section, fields: nextFields } : section,
    ),
    payload: {
      ...workspace.payload,
      form: {
        ...workspace.payload.form,
        sections: nextPayloadSections,
      },
    },
  };
}
