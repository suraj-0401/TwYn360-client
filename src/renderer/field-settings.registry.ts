import {
  isDisplayFieldType,
  normalizeFieldType,
  type FieldOption,
} from "./field-metadata.registry";
import {
  DEFAULT_LOOKUP_METADATA,
  normalizeLookupMetadata,
} from "./lookup-field.metadata";
import type { RendererFieldType } from "./types/field-types";

/** Where a setting value is persisted on the workspace field row. */
export type SettingStorage =
  | "top"
  | "config"
  | "validations"
  | "uiConfig"
  | "lookup";

export type SettingSection =
  | "basic"
  | "validation"
  | "data"
  | "layout"
  | "type";

export type SettingControlKind =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "textarea"
  | "options"
  | "readonly"
  | "lookup-collection"
  | "tooltip";

export type SettingControl = {
  id: string;
  label: string;
  section: SettingSection;
  kind: SettingControlKind;
  storage: SettingStorage;
  field?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
};

const INPUT_TYPES: RendererFieldType[] = [
  "text",
  "textarea",
  "number",
  "select",
  "radio",
  "rating",
  "checkbox",
  "date",
  "lookup",
];

function hasPlaceholder(fieldType: RendererFieldType): boolean {
  return (
    fieldType === "text" ||
    fieldType === "textarea" ||
    fieldType === "number" ||
    fieldType === "select" ||
    fieldType === "date" ||
    fieldType === "lookup"
  );
}

function hasRequired(fieldType: RendererFieldType): boolean {
  return !isDisplayFieldType(fieldType) && fieldType !== "checkbox";
}

function hasDefaultValue(fieldType: RendererFieldType): boolean {
  return INPUT_TYPES.includes(fieldType);
}

/** Global settings — filtered per fieldType at runtime. */
const GLOBAL_CONTROLS: Array<SettingControl & { applies: (ft: RendererFieldType) => boolean }> = [
  {
    id: "label",
    label: "Label",
    section: "basic",
    kind: "text",
    storage: "top",
    field: "labelOverride",
    applies: (ft) => ft !== "divider",
  },
  {
    id: "placeholder",
    label: "Placeholder",
    section: "basic",
    kind: "text",
    storage: "top",
    field: "placeholder",
    applies: hasPlaceholder,
  },
  {
    id: "helperText",
    label: "Helper text",
    section: "basic",
    kind: "text",
    storage: "config",
    field: "helperText",
    applies: (ft) => !isDisplayFieldType(ft) || ft === "heading",
  },
  {
    id: "tooltip",
    label: "Tooltip",
    section: "basic",
    kind: "tooltip",
    storage: "top",
    field: "tooltip",
    applies: (ft) => ft !== "divider",
  },
  {
    id: "required",
    label: "Required",
    section: "validation",
    kind: "boolean",
    storage: "top",
    field: "required",
    applies: hasRequired,
  },
  {
    id: "defaultValue",
    label: "Default value",
    section: "data",
    kind: "text",
    storage: "config",
    field: "defaultValue",
    applies: hasDefaultValue,
  },
  {
    id: "width",
    label: "Width",
    section: "layout",
    kind: "select",
    storage: "config",
    field: "width",
    options: [
      { value: "auto", label: "Auto" },
      { value: "33", label: "Small (33%)" },
      { value: "50", label: "Medium (50%)" },
      { value: "66", label: "Large (66%)" },
      { value: "100", label: "Full width" },
    ],
    applies: (ft) => INPUT_TYPES.includes(ft),
  },
  {
    id: "registryList",
    label: "Show in registry table",
    section: "layout",
    kind: "boolean",
    storage: "config",
    field: "registryList",
    applies: (ft) => INPUT_TYPES.includes(ft) && ft !== "dynamic-validations",
  },
  {
    id: "registryFilter",
    label: "Show in registry filters",
    section: "layout",
    kind: "boolean",
    storage: "config",
    field: "registryFilter",
    applies: (ft) => ft === "lookup",
  },
  {
    id: "registryBadge",
    label: "Badge style in table",
    section: "layout",
    kind: "boolean",
    storage: "config",
    field: "registryBadge",
    applies: (ft) => ft === "lookup",
  },
];

/** Field-type-specific settings (config / validations). */
const TYPE_CONTROLS: Partial<Record<RendererFieldType, SettingControl[]>> = {
  text: [
    {
      id: "minLength",
      label: "Min length",
      section: "validation",
      kind: "number",
      storage: "validations",
      field: "minLength",
      min: 0,
    },
    {
      id: "maxLength",
      label: "Max length",
      section: "validation",
      kind: "number",
      storage: "validations",
      field: "maxLength",
      min: 1,
    },
    {
      id: "regex",
      label: "Regex pattern",
      section: "validation",
      kind: "text",
      storage: "validations",
      field: "regex",
      placeholder: "^[A-Za-z]+$",
    },
    {
      id: "autoComplete",
      label: "Browser autocomplete",
      section: "type",
      kind: "boolean",
      storage: "config",
      field: "autoComplete",
    },
  ],
  textarea: [
    {
      id: "rows",
      label: "Rows",
      section: "type",
      kind: "number",
      storage: "config",
      field: "rows",
      min: 2,
      max: 24,
    },
    {
      id: "maxLength",
      label: "Max length",
      section: "validation",
      kind: "number",
      storage: "config",
      field: "maxLength",
      min: 1,
    },
    {
      id: "resizable",
      label: "Resizable",
      section: "type",
      kind: "boolean",
      storage: "config",
      field: "resizable",
    },
  ],
  number: [
    {
      id: "min",
      label: "Minimum",
      section: "validation",
      kind: "number",
      storage: "validations",
      field: "min",
    },
    {
      id: "max",
      label: "Maximum",
      section: "validation",
      kind: "number",
      storage: "validations",
      field: "max",
    },
    {
      id: "step",
      label: "Step",
      section: "type",
      kind: "number",
      storage: "config",
      field: "step",
      min: 0,
    },
    {
      id: "decimalPrecision",
      label: "Decimal precision",
      section: "type",
      kind: "number",
      storage: "config",
      field: "decimalPrecision",
      min: 0,
      max: 10,
    },
    {
      id: "negativeAllowed",
      label: "Allow negative values",
      section: "type",
      kind: "boolean",
      storage: "config",
      field: "negativeAllowed",
    },
    {
      id: "unit",
      label: "Unit",
      section: "data",
      kind: "text",
      storage: "config",
      field: "unit",
      placeholder: "kg, mg/dL, …",
    },
  ],
  checkbox: [
    {
      id: "checkedByDefault",
      label: "Checked by default",
      section: "type",
      kind: "boolean",
      storage: "config",
      field: "checkedByDefault",
    },
    {
      id: "labelPosition",
      label: "Label position",
      section: "type",
      kind: "select",
      storage: "config",
      field: "labelPosition",
      options: [
        { value: "right", label: "Right of checkbox" },
        { value: "left", label: "Left of checkbox" },
      ],
    },
  ],
  radio: [
    {
      id: "options",
      label: "Options (one per line)",
      section: "type",
      kind: "options",
      storage: "config",
      field: "options",
    },
    {
      id: "inline",
      label: "Inline layout",
      section: "type",
      kind: "boolean",
      storage: "config",
      field: "inline",
    },
  ],
  select: [
    {
      id: "options",
      label: "Options (one per line)",
      section: "type",
      kind: "options",
      storage: "config",
      field: "options",
    },
    {
      id: "searchable",
      label: "Searchable",
      section: "type",
      kind: "boolean",
      storage: "config",
      field: "searchable",
    },
    {
      id: "multiSelect",
      label: "Allow multiple selections",
      section: "type",
      kind: "boolean",
      storage: "config",
      field: "multiSelect",
    },
  ],
  date: [
    {
      id: "minDate",
      label: "Minimum date",
      section: "validation",
      kind: "text",
      storage: "config",
      field: "minDate",
      placeholder: "YYYY-MM-DD",
    },
    {
      id: "maxDate",
      label: "Maximum date",
      section: "validation",
      kind: "text",
      storage: "config",
      field: "maxDate",
      placeholder: "YYYY-MM-DD",
    },
    {
      id: "format",
      label: "Display format",
      section: "type",
      kind: "text",
      storage: "config",
      field: "format",
      placeholder: "DD/MM/YYYY",
    },
  ],
  lookup: [
    {
      id: "lookupCollection",
      label: "Collection",
      section: "type",
      kind: "lookup-collection",
      storage: "lookup",
      field: "collectionId",
    },
    {
      id: "lookupMultiple",
      label: "Multiple selection",
      section: "type",
      kind: "boolean",
      storage: "lookup",
      field: "multiple",
    },
    {
      id: "lookupAllowCreate",
      label: "Allow create",
      section: "type",
      kind: "boolean",
      storage: "lookup",
      field: "allowCreate",
    },
    {
      id: "lookupSearchable",
      label: "Searchable",
      section: "type",
      kind: "boolean",
      storage: "lookup",
      field: "searchable",
    },
    {
      id: "lookupAsyncLoading",
      label: "Async loading",
      section: "type",
      kind: "boolean",
      storage: "lookup",
      field: "asyncLoading",
    },
  ],
  heading: [
    {
      id: "level",
      label: "Heading level",
      section: "type",
      kind: "select",
      storage: "config",
      field: "level",
      options: [
        { value: "1", label: "H1" },
        { value: "2", label: "H2" },
        { value: "3", label: "H3" },
        { value: "4", label: "H4" },
      ],
    },
  ],
  divider: [],
};

const SECTION_LABELS: Record<SettingSection, string> = {
  basic: "General",
  validation: "Validation",
  data: "Defaults",
  layout: "Layout",
  type: "Options",
};

const SECTION_ORDER: SettingSection[] = [
  "basic",
  "validation",
  "data",
  "layout",
  "type",
];

export type SettingsSectionGroup = {
  section: SettingSection;
  title: string;
  controls: SettingControl[];
};

export function getSettingsSchemaForFieldType(
  rawFieldType: string,
): SettingsSectionGroup[] {
  const fieldType = normalizeFieldType(rawFieldType);

  const globals = GLOBAL_CONTROLS.filter((c) => c.applies(fieldType)).map(
    ({ applies: _a, ...control }) => control,
  );
  const typeSpecific = TYPE_CONTROLS[fieldType] ?? [];

  const all = [...globals, ...typeSpecific];
  const groups: SettingsSectionGroup[] = [];

  for (const section of SECTION_ORDER) {
    const controls = all.filter(
      (c) => c.section === section && c.kind !== "readonly",
    );
    if (controls.length > 0) {
      groups.push({
        section,
        title: SECTION_LABELS[section],
        controls,
      });
    }
  }

  return groups;
}

export function readSettingValue(
  field: {
    fieldKey: string;
    labelOverride: string | null;
    placeholder: string | null;
    tooltip: string | null;
    required: boolean;
    config: Record<string, unknown> | null;
    validationsOverride?: Record<string, unknown> | null;
    uiConfig?: { width?: "full" | "half" } | null;
  },
  control: SettingControl,
): string | number | boolean | undefined {
  if (control.kind === "readonly") {
    return field.fieldKey;
  }

  const bucket = control.storage;
  const key = control.field ?? "";

  if (bucket === "top") {
    const top = field as Record<string, unknown>;
    const v = top[key];
    if (key === "required") {
      return Boolean(v);
    }
    return v == null ? "" : String(v);
  }

  if (bucket === "uiConfig") {
    const v = field.uiConfig?.[key as keyof typeof field.uiConfig];
    return v == null ? "" : String(v);
  }

  if (bucket === "validations") {
    const v = field.validationsOverride?.[key];
    if (typeof v === "boolean") {
      return v;
    }
    if (typeof v === "number") {
      return v;
    }
    return v == null ? "" : String(v);
  }

  if (bucket === "lookup") {
    const meta =
      normalizeLookupMetadata(field.config?.lookup) ?? DEFAULT_LOOKUP_METADATA;
    const v = meta[key as keyof typeof meta];
    if (control.kind === "boolean") {
      return v !== false;
    }
    return v == null ? "" : String(v);
  }

  const v = field.config?.[key];
  if (control.kind === "boolean") {
    return Boolean(v);
  }
  if (control.kind === "number" && typeof v === "number") {
    return v;
  }
  if (key === "defaultValue" && v != null && typeof v !== "string") {
    return String(v);
  }
  return v == null ? "" : String(v);
}

export function optionsToText(options: FieldOption[] | undefined): string {
  const lines = options?.map((o) => o.label).join("\n");
  return lines && lines.length > 0 ? lines : "Option 1\nOption 2";
}

export function textToOptions(text: string): FieldOption[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label, i) => ({
      value: `option_${i + 1}`,
      label,
    }));
}

export type FieldSettingsPatch = {
  labelOverride?: string;
  placeholder?: string;
  tooltip?: string;
  required?: boolean;
  config?: Record<string, unknown>;
  validationsOverride?: Record<string, unknown>;
  uiConfig?: { width?: "full" | "half" };
};

export function mergeFieldSettingsPatch(
  prev: FieldSettingsPatch,
  next: FieldSettingsPatch,
): FieldSettingsPatch {
  return {
    ...prev,
    ...next,
    config: next.config
      ? {
          ...prev.config,
          ...next.config,
          ...(next.config.lookup
            ? {
                lookup: {
                  ...(prev.config?.lookup &&
                  typeof prev.config.lookup === "object" &&
                  !Array.isArray(prev.config.lookup)
                    ? (prev.config.lookup as Record<string, unknown>)
                    : {}),
                  ...(next.config.lookup as Record<string, unknown>),
                },
              }
            : {}),
        }
      : prev.config,
    validationsOverride: next.validationsOverride
      ? { ...prev.validationsOverride, ...next.validationsOverride }
      : prev.validationsOverride,
    uiConfig: next.uiConfig ? { ...prev.uiConfig, ...next.uiConfig } : prev.uiConfig,
  };
}

export function readTooltipEnabled(field: {
  tooltip: string | null;
  config: Record<string, unknown> | null;
}): boolean {
  return field.config?.tooltipEnabled === true;
}

export function patchFromTooltipControl(
  enabled: boolean,
  message: string,
): FieldSettingsPatch {
  return {
    tooltip: message.trim() || undefined,
    config: { tooltipEnabled: enabled },
  };
}

export function patchFromControl(
  control: SettingControl,
  value: string | number | boolean,
  field: { config: Record<string, unknown> | null },
): FieldSettingsPatch {
  if (control.kind === "readonly" || control.kind === "options" || control.kind === "tooltip") {
    return {};
  }

  if (control.storage === "top") {
    if (control.field === "required") {
      return { required: Boolean(value) };
    }
    if (control.field === "labelOverride") {
      return { labelOverride: String(value) };
    }
    if (control.field === "placeholder") {
      return { placeholder: String(value) };
    }
    if (control.field === "tooltip") {
      return { tooltip: String(value) };
    }
    return {};
  }

  if (control.storage === "lookup" && control.field) {
    const existing =
      normalizeLookupMetadata(field.config?.lookup) ?? {
        collectionId: "",
        ...DEFAULT_LOOKUP_METADATA,
      };
    const key = control.field as keyof typeof existing;
    const next =
      control.kind === "boolean"
        ? Boolean(value)
        : String(value);
    return {
      config: {
        lookup: {
          ...existing,
          [key]: next,
        },
      },
    };
  }

  if (control.storage === "validations" && control.field) {
    const parsed =
      control.kind === "number" && value !== ""
        ? Number(value)
        : value === ""
          ? undefined
          : value;
    return {
      validationsOverride: {
        [control.field]: parsed,
      },
    };
  }

  if (control.storage === "config" && control.field) {
    let parsed: unknown = value;
    if (control.kind === "number") {
      parsed = value === "" ? undefined : Number(value);
    } else if (control.kind === "boolean") {
      parsed = Boolean(value);
    } else if (control.field === "level") {
      parsed = Number(value) as 1 | 2 | 3 | 4;
    } else if (control.field === "defaultValue") {
      const s = String(value);
      parsed = s === "" ? undefined : s;
    }
    return {
      config: {
        [control.field]: parsed,
      },
    };
  }

  return {};
}
