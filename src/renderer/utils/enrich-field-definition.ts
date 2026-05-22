import { normalizeLookupMetadata } from "@/renderer/lookup-field.metadata";
import type { FieldDefinition } from "@/renderer/types";
import type { WorkspaceFieldRecord } from "@/types/workspace";

/** Apply tooltipEnabled gating for fill/view mode (payload definitions). */
export function resolveFieldTooltipForDisplay(
  definition: FieldDefinition,
): FieldDefinition {
  const config = definition.config ?? {};
  const tooltipEnabled = config.tooltipEnabled === true;
  const tooltipText = definition.tooltip;

  return {
    ...definition,
    tooltip:
      tooltipEnabled && tooltipText?.trim() ? tooltipText.trim() : undefined,
  };
}

/** Merge live DB field row into renderer payload definition (builder canvas). */
export function enrichFieldDefinition(
  definition: FieldDefinition,
  record?: WorkspaceFieldRecord | null,
): FieldDefinition {
  if (!record) {
    return definition;
  }

  const lookup = normalizeLookupMetadata(record.config?.lookup);
  const recordConfig =
    record.config && typeof record.config === "object" ? record.config : {};
  const config = {
    ...(definition.config ?? {}),
    ...recordConfig,
  };
  const tooltipEnabled = recordConfig.tooltipEnabled === true;
  const tooltipText = record.tooltip ?? definition.tooltip;

  return {
    ...definition,
    label: record.labelOverride ?? definition.label,
    placeholder: record.placeholder ?? definition.placeholder,
    tooltip: tooltipEnabled && tooltipText?.trim() ? tooltipText : undefined,
    required: record.required,
    config,
    ...(lookup ? { lookup } : {}),
  };
}
