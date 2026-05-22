/** fieldType drives UI; dataType drives scientific meaning / persistence. */

export const RENDERER_FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "checkbox",
  "select",
  "dropdown",
  "radio",
  "rating",
  "date",
  "lookup",
  "dynamic-validations",
  "heading",
  "divider",
] as const;

export type RendererFieldType = (typeof RENDERER_FIELD_TYPES)[number];

export const SCIENTIFIC_DATA_TYPES = [
  "string",
  "number",
  "boolean",
  "enum",
  "date",
  "json",
  "array",
] as const;

export type ScientificDataType = (typeof SCIENTIFIC_DATA_TYPES)[number];

export const RENDERER_FORM_IDS = {
  FACTOR_FORM: "factor-form",
} as const;

export type RendererFormId =
  | (typeof RENDERER_FORM_IDS)[keyof typeof RENDERER_FORM_IDS]
  | string;

export const VISIBILITY_OPERATORS = [
  "equals",
  "notEquals",
  "in",
  "notEmpty",
  "empty",
] as const;

export type VisibilityOperator = (typeof VISIBILITY_OPERATORS)[number];

export const FIELD_WIDTHS = [
  "auto",
  "25",
  "33",
  "50",
  "66",
  "75",
  "100",
  "half",
  "full",
] as const;

export type FieldWidth = (typeof FIELD_WIDTHS)[number];

export const SECTION_COLUMNS = [1, 2] as const;

export type SectionColumns = (typeof SECTION_COLUMNS)[number];
