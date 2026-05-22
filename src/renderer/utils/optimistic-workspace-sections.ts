import type { SectionSettingsPatch } from "@/renderer/section-metadata.registry";
import { parseSectionLayout } from "@/renderer/section-metadata.registry";
import type { FormDefinitionPayload, SectionDefinition } from "@/renderer/types";
import type { WorkspaceDetail, WorkspaceSectionRecord } from "@/types/workspace";

function reorderPayloadSections(
  payload: FormDefinitionPayload,
  orderedKeys: string[],
): FormDefinitionPayload {
  const byKey = new Map(payload.form.sections.map((s) => [s.id, s]));
  const sections = orderedKeys
    .map((key) => byKey.get(key))
    .filter((s): s is SectionDefinition => Boolean(s));

  return {
    ...payload,
    form: {
      ...payload.form,
      sections,
    },
  };
}

export function applyOptimisticSectionRemove(
  workspace: WorkspaceDetail,
  sectionId: string,
): WorkspaceDetail {
  const record = workspace.sections.find((s) => s.id === sectionId);
  if (!record) {
    return workspace;
  }

  const payloadSection = workspace.payload.form.sections.find(
    (s) => s.id === record.key,
  );
  const fieldIds = new Set(payloadSection?.fields ?? []);
  const nextFields = { ...workspace.payload.fields };
  for (const fieldId of fieldIds) {
    delete nextFields[fieldId];
  }

  return {
    ...workspace,
    sections: workspace.sections.filter((s) => s.id !== sectionId),
    payload: {
      ...workspace.payload,
      fields: nextFields,
      form: {
        ...workspace.payload.form,
        sections: workspace.payload.form.sections.filter(
          (s) => s.id !== record.key,
        ),
      },
    },
  };
}

export function applyOptimisticSectionAdd(
  workspace: WorkspaceDetail,
  title: string,
  afterIndex?: number,
): WorkspaceDetail {
  const tempId = `pending-${crypto.randomUUID()}`;
  const key = `section_${workspace.sections.length + 1}_${Date.now()}`;

  const newRecord: WorkspaceSectionRecord = {
    id: tempId,
    formId: workspace.id,
    key,
    title,
    description: null,
    tooltip: null,
    displayOrder:
      afterIndex !== undefined ? afterIndex + 1 : workspace.sections.length,
    layoutConfig: {
      columns: 2,
      collapsible: true,
      defaultExpanded: true,
      sectionType: "standard",
    },
    fields: [],
  };

  const newPayloadSection: SectionDefinition = {
    id: key,
    title,
    layout: {
      columns: 2,
      collapsible: true,
      defaultExpanded: true,
      sectionType: "standard",
    },
    fields: [],
  };

  const nextRecords = [...workspace.sections];
  const nextPayloadSections = [...workspace.payload.form.sections];

  if (afterIndex !== undefined && afterIndex >= 0) {
    nextRecords.splice(afterIndex + 1, 0, newRecord);
    nextPayloadSections.splice(afterIndex + 1, 0, newPayloadSection);
  } else {
    nextRecords.push(newRecord);
    nextPayloadSections.push(newPayloadSection);
  }

  const orderedKeys = nextPayloadSections.map((s) => s.id);
  const reorderedRecords = nextRecords.map((s, index) => ({
    ...s,
    displayOrder: index,
  }));

  return {
    ...workspace,
    sections: reorderedRecords,
    payload: reorderPayloadSections(
      {
        ...workspace.payload,
        form: {
          ...workspace.payload.form,
          sections: nextPayloadSections,
        },
      },
      orderedKeys,
    ),
  };
}

export function applyOptimisticSectionPatch(
  workspace: WorkspaceDetail | undefined,
  sectionId: string,
  patch: SectionSettingsPatch,
): WorkspaceDetail | undefined {
  if (!workspace) {
    return workspace;
  }

  const record = workspace.sections.find((s) => s.id === sectionId);
  if (!record) {
    return workspace;
  }

  const existingLayout =
    record.layoutConfig && typeof record.layoutConfig === "object"
      ? record.layoutConfig
      : {};
  const mergedLayout = patch.layoutConfig
    ? { ...existingLayout, ...patch.layoutConfig }
    : existingLayout;

  const nextDescription =
    patch.description !== undefined
      ? patch.description?.trim()
        ? patch.description.trim()
        : null
      : record.description;
  const nextTooltip =
    patch.tooltip !== undefined
      ? patch.tooltip?.trim()
        ? patch.tooltip.trim()
        : null
      : record.tooltip;

  const nextRecord: WorkspaceSectionRecord = {
    ...record,
    title: patch.title !== undefined ? patch.title : record.title,
    description: nextDescription,
    tooltip: nextTooltip,
    layoutConfig:
      Object.keys(mergedLayout).length > 0
        ? (mergedLayout as WorkspaceSectionRecord["layoutConfig"])
        : record.layoutConfig,
  };

  const layout = parseSectionLayout(nextRecord.layoutConfig);
  const tooltipEnabled = layout.tooltipEnabled;
  const tooltipText = nextRecord.tooltip ?? undefined;

  const nextPayloadSections = workspace.payload.form.sections.map((section) => {
    if (section.id !== record.key) {
      return section;
    }
    const nextSection: SectionDefinition = {
      ...section,
      title: patch.title !== undefined ? patch.title : section.title,
      description:
        patch.description !== undefined
          ? nextDescription ?? undefined
          : section.description,
      tooltip:
        tooltipEnabled && tooltipText?.trim() ? tooltipText : undefined,
      layout: {
        ...(section.layout ?? {}),
        ...(patch.layoutConfig ?? {}),
      },
    };
    return nextSection;
  });

  return {
    ...workspace,
    sections: workspace.sections.map((s) =>
      s.id === sectionId ? nextRecord : s,
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

export function applyOptimisticSectionReorder(
  workspace: WorkspaceDetail,
  orderedSectionIds: string[],
): WorkspaceDetail {
  const recordById = new Map(workspace.sections.map((s) => [s.id, s]));
  const nextRecords = orderedSectionIds
    .map((id, index) => {
      const section = recordById.get(id);
      return section ? { ...section, displayOrder: index } : null;
    })
    .filter((s): s is WorkspaceSectionRecord => Boolean(s));

  const orderedKeys = nextRecords.map((s) => s.key);
  return {
    ...workspace,
    sections: nextRecords,
    payload: reorderPayloadSections(workspace.payload, orderedKeys),
  };
}
