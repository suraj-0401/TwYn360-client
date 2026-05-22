import { cn } from "@/lib/utils";
import {
  normalizeFieldType,
  type FieldConfig,
} from "./field-metadata.registry";
import type { FieldDefinition } from "./types";
import type { RendererFieldType } from "./types/field-types";

export type FieldSpan =
  | "auto"
  | "25"
  | "33"
  | "50"
  | "66"
  | "75"
  | "100"
  | "half"
  | "full";

const VALID_SPANS = new Set<string>([
  "auto",
  "25",
  "33",
  "50",
  "66",
  "75",
  "100",
  "half",
  "full",
]);

export const FIELD_SPAN_OPTIONS: Array<{ value: FieldSpan; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "33", label: "Small (33%)" },
  { value: "50", label: "Medium (50%)" },
  { value: "66", label: "Large (66%)" },
  { value: "100", label: "Full width" },
];

export function normalizeFieldSpan(raw: unknown): FieldSpan | undefined {
  if (typeof raw !== "string" || !VALID_SPANS.has(raw)) {
    return undefined;
  }
  if (raw === "half") {
    return "50";
  }
  if (raw === "full") {
    return "100";
  }
  return raw as FieldSpan;
}

/** Smart defaults — prevents oversized controls. */
export function defaultFieldSpan(fieldType: RendererFieldType): FieldSpan {
  const type = normalizeFieldType(fieldType);
  switch (type) {
    case "textarea":
    case "heading":
    case "divider":
    case "dynamic-validations":
      return "100";
    case "number":
    case "date":
      return "33";
    case "radio":
    case "rating":
    case "checkbox":
      return "auto";
    case "select":
      return "50";
    default:
      return "50";
  }
}

function forcedSpanForType(fieldType: RendererFieldType): FieldSpan | null {
  const type = normalizeFieldType(fieldType);
  if (
    type === "textarea" ||
    type === "heading" ||
    type === "divider" ||
    type === "dynamic-validations"
  ) {
    return "100";
  }
  return null;
}

export function resolveFieldSpan(
  definition: {
    fieldType?: RendererFieldType;
    layout?: { width?: string };
    uiConfig?: { width?: string };
    config?: FieldConfig & { width?: string };
  },
  fieldType?: RendererFieldType,
): FieldSpan {
  const type =
    fieldType ??
    (definition.fieldType
      ? normalizeFieldType(definition.fieldType)
      : "text");

  const forced = forcedSpanForType(type);
  if (forced) {
    return forced;
  }

  const explicit =
    normalizeFieldSpan(definition.layout?.width) ??
    normalizeFieldSpan(definition.uiConfig?.width) ??
    normalizeFieldSpan(definition.config?.width);

  if (explicit) {
    return explicit;
  }

  return defaultFieldSpan(type);
}

const SPAN_COL: Record<FieldSpan, string> = {
  auto: "col-span-12 sm:col-span-6",
  "25": "col-span-12 sm:col-span-3",
  "33": "col-span-12 sm:col-span-4",
  "50": "col-span-12 sm:col-span-6",
  "66": "col-span-12 sm:col-span-8",
  "75": "col-span-12 sm:col-span-9",
  "100": "col-span-12",
  half: "col-span-12 sm:col-span-6",
  full: "col-span-12",
};

/** Caps input width so fields do not stretch across the full section. */
const SPAN_MAX_W: Record<FieldSpan, string> = {
  auto: "w-fit max-w-full justify-self-start",
  "25": "w-full max-w-[180px] justify-self-start",
  "33": "w-full max-w-[240px] justify-self-start",
  "50": "w-full max-w-[320px] justify-self-start",
  "66": "w-full max-w-[380px] justify-self-start",
  "75": "w-full max-w-[420px] justify-self-start",
  "100": "w-full max-w-full",
  half: "w-full max-w-[320px] justify-self-start",
  full: "w-full max-w-full",
};

/** Textareas: full row but readable line length. */
export function fieldContentWrapClass(
  span: FieldSpan,
  fieldType?: RendererFieldType,
): string {
  const type = fieldType ? normalizeFieldType(fieldType) : null;
  if (type === "textarea") {
    return "w-full max-w-[520px] justify-self-start";
  }
  return SPAN_MAX_W[span] ?? SPAN_MAX_W["50"];
}

export function fieldSpanGridClass(span: FieldSpan): string {
  return cn(SPAN_COL[span] ?? SPAN_COL["50"], "min-w-0");
}

export function fieldCellLayoutClass(definition: FieldDefinition): string {
  const span = resolveFieldSpan(definition, definition.fieldType);
  return cn(
    fieldSpanGridClass(span),
    fieldContentWrapClass(span, definition.fieldType),
  );
}
