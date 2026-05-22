import type { RendererFieldType, ScientificDataType } from "./types/field-types";

export type FieldOption = { value: string; label: string };

export type FieldConfig = {
  options?: FieldOption[];
  rows?: number;
  min?: number;
  max?: number;
  maxLength?: number;
  minLength?: number;
  level?: 1 | 2 | 3 | 4;
  inline?: boolean;
  width?: string;
  minRating?: number;
  maxRating?: number;
};

export type FieldTypeRegistryEntry = {
  fieldType: RendererFieldType;
  label: string;
  category: "basic" | "selection" | "datetime" | "scientific" | "display";
  defaultDataType: ScientificDataType;
  isInput: boolean;
  isDisplay: boolean;
  builderEnabled: boolean;
};

export const FIELD_TYPE_REGISTRY: FieldTypeRegistryEntry[] = [
  { fieldType: "text", label: "Short answer", category: "basic", defaultDataType: "string", isInput: true, isDisplay: false, builderEnabled: true },
  { fieldType: "textarea", label: "Paragraph", category: "basic", defaultDataType: "string", isInput: true, isDisplay: false, builderEnabled: true },
  { fieldType: "number", label: "Number", category: "basic", defaultDataType: "number", isInput: true, isDisplay: false, builderEnabled: true },
  { fieldType: "select", label: "Dropdown", category: "selection", defaultDataType: "enum", isInput: true, isDisplay: false, builderEnabled: true },
  { fieldType: "radio", label: "Radio group", category: "selection", defaultDataType: "enum", isInput: true, isDisplay: false, builderEnabled: true },
  { fieldType: "checkbox", label: "Checkbox", category: "selection", defaultDataType: "boolean", isInput: true, isDisplay: false, builderEnabled: true },
  { fieldType: "rating", label: "Rating (1–5)", category: "selection", defaultDataType: "number", isInput: true, isDisplay: false, builderEnabled: true },
  { fieldType: "date", label: "Date", category: "datetime", defaultDataType: "date", isInput: true, isDisplay: false, builderEnabled: true },
  { fieldType: "lookup", label: "Lookup", category: "scientific", defaultDataType: "string", isInput: true, isDisplay: false, builderEnabled: true },
  { fieldType: "heading", label: "Heading", category: "display", defaultDataType: "string", isInput: false, isDisplay: true, builderEnabled: true },
  { fieldType: "divider", label: "Divider", category: "display", defaultDataType: "string", isInput: false, isDisplay: true, builderEnabled: true },
];

const BY_TYPE = new Map(FIELD_TYPE_REGISTRY.map((e) => [e.fieldType, e]));

export function normalizeFieldType(raw: string): RendererFieldType {
  if (raw === "dropdown") {
    return "select";
  }
  return raw as RendererFieldType;
}

export function getFieldTypeEntry(
  fieldType: RendererFieldType,
): FieldTypeRegistryEntry | undefined {
  return BY_TYPE.get(normalizeFieldType(fieldType));
}

export function isDisplayFieldType(fieldType: RendererFieldType): boolean {
  return getFieldTypeEntry(fieldType)?.isDisplay ?? false;
}

export const BUILDER_FIELD_TYPES = FIELD_TYPE_REGISTRY.filter(
  (e) => e.builderEnabled,
).map((e) => e.fieldType);

export const FIELD_TYPE_CATALOG = FIELD_TYPE_REGISTRY.filter(
  (e) => e.builderEnabled,
);

export function resolveFieldOptions(definition: {
  options?: FieldOption[];
  config?: FieldConfig;
}): FieldOption[] {
  return definition.config?.options ?? definition.options ?? [];
}

/** @deprecated Use resolveFieldSpan from field-span.ts */
export function resolveFieldWidth(definition: {
  layout?: { width?: string };
  uiConfig?: { width?: string };
  config?: FieldConfig;
}): string | undefined {
  return (
    definition.layout?.width ??
    definition.uiConfig?.width ??
    definition.config?.width
  );
}
