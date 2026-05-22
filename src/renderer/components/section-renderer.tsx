"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "@/components/shared/section-header";
import { cn } from "@/lib/utils";
import {
  formSectionClass,
  formSectionHeaderClass,
  formSectionSelectedClass,
} from "@/renderer/form-styles";
import {
  parseSectionLayout,
  readSectionTooltipEnabled,
} from "@/renderer/section-metadata.registry";
import type { FieldDefinition, SectionDefinition } from "../types";
import { useWorkspaceEdit } from "../context/workspace-edit-context";
import { evaluateVisibility } from "../utils/visibility";
import { fieldCellLayoutClass } from "../field-span";
import {
  sectionDensityPaddingClass,
  sectionGridClass,
} from "../utils/field-layout";
import {
  rendererFieldIdMatchesKey,
  toRendererFieldId,
} from "../utils/field-keys";
import {
  enrichFieldDefinition,
  resolveFieldTooltipForDisplay,
} from "../utils/enrich-field-definition";
import { EditableSectionHeader } from "./editable-section-header";
import { FieldEditChrome } from "./field-edit-chrome";
import { FieldRenderer } from "./field-renderer";
import { SectionAddFieldRow } from "./section-add-field-row";

type SectionRendererProps = {
  section: SectionDefinition;
  sectionIndex: number;
  sectionCount: number;
  fields: Record<string, FieldDefinition>;
  values: Record<string, unknown>;
  onFieldChange: (fieldId: string, value: unknown) => void;
  adminKey?: string;
  editable?: boolean;
};

export function SectionRenderer({
  section,
  sectionIndex,
  sectionCount,
  fields,
  values,
  onFieldChange,
  adminKey,
  editable = false,
}: SectionRendererProps) {
  const edit = useWorkspaceEdit();
  const editLayout = editable && (edit ? edit.editEnabled : false);
  const sectionRecord = edit?.sectionRecordByKey(section.id);
  const sectionDbId = sectionRecord?.id;
  const sectionLayoutSource = sectionRecord?.layoutConfig ?? section.layout;
  const layout = parseSectionLayout(sectionLayoutSource);
  const tooltipEnabled = sectionRecord
    ? readSectionTooltipEnabled(sectionRecord.layoutConfig)
    : layout.tooltipEnabled;
  const sectionTooltip =
    tooltipEnabled && (sectionRecord?.tooltip ?? section.tooltip)?.trim()
      ? (sectionRecord?.tooltip ?? section.tooltip)?.trim()
      : undefined;

  const [expanded, setExpanded] = useState(layout.defaultExpanded);

  useEffect(() => {
    setExpanded(layout.defaultExpanded);
  }, [section.id, layout.defaultExpanded]);

  if (!editLayout && !evaluateVisibility(section.visibility, values)) {
    return null;
  }

  const visibleFieldIds = section.fields.filter((fieldId) => {
    const definition = fields[fieldId];
    if (!definition) {
      return false;
    }
    if (editLayout) {
      return true;
    }
    return evaluateVisibility(definition.visibility, values);
  });

  if (!editLayout && visibleFieldIds.length === 0) {
    return null;
  }

  const selected = editLayout && sectionDbId === edit?.selectedSectionId;
  const showBody = !layout.collapsible || expanded;

  const title = sectionRecord?.title ?? section.title;
  const description = sectionRecord?.description ?? section.description;

  const sectionCard = (
    <article
      className={cn(
        formSectionClass,
        sectionDensityPaddingClass(sectionLayoutSource),
        "group/section relative scroll-mt-6",
        selected && !edit?.selectedFieldId && formSectionSelectedClass,
      )}
      onClick={
        editLayout && sectionDbId
          ? () => {
              edit?.selectSection(sectionDbId);
              edit?.selectField(null);
            }
          : undefined
      }
    >
      <header
        className={formSectionHeaderClass}
        onClick={editLayout ? (e) => e.stopPropagation() : undefined}
      >
        {editLayout && sectionDbId ? (
          <EditableSectionHeader
            sectionKey={section.id}
            sectionId={sectionDbId}
            sectionIndex={sectionIndex}
            sectionCount={sectionCount}
            title={title}
            description={description}
            tooltip={sectionTooltip}
          />
        ) : layout.collapsible ? (
          <div
            role="button"
            tabIndex={0}
            className="flex w-full cursor-pointer items-start gap-2 text-left"
            onClick={() => setExpanded((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setExpanded((v) => !v);
              }
            }}
          >
            <span
              className={cn(
                "mt-2 text-xs text-[#f4f4f5]/50 transition-transform",
                expanded && "rotate-90",
              )}
            >
              ▶
            </span>
            <SectionHeader
              title={title}
              description={description}
              tooltip={sectionTooltip}
            />
          </div>
        ) : (
          <SectionHeader
            title={title}
            description={description}
            tooltip={sectionTooltip}
          />
        )}
      </header>

      {showBody ? (
        <div
          className={sectionGridClass(section, sectionLayoutSource)}
          onClick={editLayout ? (e) => e.stopPropagation() : undefined}
          onKeyDown={editLayout ? (e) => e.stopPropagation() : undefined}
          role="presentation"
        >
          {visibleFieldIds.map((fieldId, fieldIndex) => {
            const baseDefinition = fields[fieldId];
            if (!baseDefinition) {
              return null;
            }

            const fieldRecord =
              edit?.fieldRecordByKey(section.id, fieldId) ??
              sectionRecord?.fields.find(
                (f) =>
                  toRendererFieldId(f.fieldKey) === toRendererFieldId(fieldId),
              ) ??
              sectionRecord?.fields.find((f) =>
                rendererFieldIdMatchesKey(fieldId, f.fieldKey),
              );
            const definition = editLayout
              ? enrichFieldDefinition(baseDefinition, fieldRecord)
              : resolveFieldTooltipForDisplay(baseDefinition);

            if (editLayout && sectionDbId) {
              return (
                <FieldEditChrome
                  key={fieldId}
                  gridClassName={cn("group", fieldCellLayoutClass(definition))}
                  sectionKey={section.id}
                  fieldKey={fieldId}
                  fieldId={fieldRecord?.id ?? fieldId}
                  sectionId={sectionDbId}
                  fieldIndex={fieldIndex}
                  fieldCount={visibleFieldIds.length}
                  disabled={!fieldRecord}
                >
                  <FieldRenderer
                    definition={definition}
                    allFields={fields}
                    fieldDbId={fieldRecord?.id}
                    sectionDbId={sectionDbId}
                    value={values[fieldId]}
                    values={values}
                    onFieldChange={onFieldChange}
                    adminKey={adminKey}
                    embedded
                  />
                </FieldEditChrome>
              );
            }

            return (
              <FieldRenderer
                key={fieldId}
                definition={definition}
                allFields={fields}
                fieldDbId={fieldRecord?.id}
                sectionDbId={sectionDbId}
                value={values[fieldId]}
                values={values}
                onFieldChange={onFieldChange}
                adminKey={adminKey}
              />
            );
          })}
          {editLayout && sectionDbId ? (
            <SectionAddFieldRow sectionId={sectionDbId} />
          ) : null}
        </div>
      ) : null}
    </article>
  );

  return sectionCard;
}
