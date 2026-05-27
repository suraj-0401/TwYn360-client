import type { FieldProtectionLevel } from "@/config/field-protection";
import type {
  FieldWidth,
  RendererFieldType,
  ScientificDataType,
  SectionColumns,
  VisibilityOperator,
} from "./field-types";

export type { FieldProtectionLevel };

export interface VisibilityRule {
  dependsOn: string;
  operator: VisibilityOperator;
  value?: unknown;
}

export interface FieldUiConfig {
  width?: FieldWidth;
}

export interface FieldLookupMetadata {
  collectionId: string;
  searchable?: boolean;
  multiple?: boolean;
  allowCreate?: boolean;
  asyncLoading?: boolean;
}

export interface FieldConfig {
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  min?: number;
  max?: number;
  maxLength?: number;
  minLength?: number;
  decimalPrecision?: number;
  negativeAllowed?: boolean;
  unit?: string;
  searchable?: boolean;
  multiSelect?: boolean;
  inline?: boolean;
  minDate?: string;
  maxDate?: string;
  level?: 1 | 2 | 3 | 4;
  variant?: "default" | "info" | "warning";
  width?: FieldWidth;
  helperText?: string;
  /** When true, label shows an info icon with `tooltip` text on hover. */
  tooltipEnabled?: boolean;
  defaultValue?: unknown;
  checkedByDefault?: boolean;
  labelPosition?: "left" | "right";
  format?: string;
  minRating?: number;
  maxRating?: number;
  lookup?: FieldLookupMetadata;
  step?: number;
  /** Factor registry: show as a column on /factors table. */
  registryList?: boolean;
  /** Factor registry: show as a lookup filter on /factors (lookup fields only). */
  registryFilter?: boolean;
  /** Factor registry: render list cell as a status badge. */
  registryBadge?: boolean;
  resizable?: boolean;
  autoComplete?: boolean;
}

export interface FieldLayout {
  width?: FieldWidth;
}

export type SectionType =
  | "standard"
  | "repeatable"
  | "accordion"
  | "tabs"
  | "wizard-step";

export interface SectionLayout {
  columns?: SectionColumns;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  sectionType?: SectionType;
  tooltipEnabled?: boolean;
}

export interface FieldDefinition {
  id: string;
  fieldType: RendererFieldType;
  dataType?: ScientificDataType;
  /** G1 — layout removability (from API or computed client-side). */
  protection: FieldProtectionLevel;
  label: string;
  placeholder?: string;
  tooltip?: string;
  required?: boolean;
  defaultValue?: unknown;
  validations?: Record<string, unknown>;
  config?: FieldConfig;
  options?: Array<{ value: string; label: string }>;
  layout?: FieldLayout;
  lookup?: FieldLookupMetadata;
  visibility?: VisibilityRule;
  dynamicRequiredFrom?: string;
  uiConfig?: FieldUiConfig;
}

export interface SectionDefinition {
  id: string;
  title: string;
  description?: string;
  tooltip?: string;
  layout?: SectionLayout;
  fields: string[];
  visibility?: VisibilityRule;
}

export interface FormDefinition {
  id: string;
  title: string;
  description?: string;
  schemaVersion?: number;
  sections: SectionDefinition[];
}

export interface FormDefinitionPayload {
  form: FormDefinition;
  fields: Record<string, FieldDefinition>;
}
