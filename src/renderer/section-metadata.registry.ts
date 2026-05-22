/** Section container types — only `standard` is fully supported in MVP. */
export type SectionType =
  | "standard"
  | "repeatable"
  | "accordion"
  | "tabs"
  | "wizard-step";

export type SectionDensity = "compact" | "comfortable" | "spacious";
export type SectionFieldGap = 12 | 16 | 24 | 32;

export type SectionLayoutConfig = {
  columns?: 1 | 2;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  sectionType?: SectionType;
  /** When true, section title shows an info icon with `tooltip` on hover. */
  tooltipEnabled?: boolean;
  /** Vertical rhythm inside the section. */
  density?: SectionDensity;
  /** Gap between fields in the section grid. */
  fieldGap?: SectionFieldGap;
};

export const SECTION_TYPE_OPTIONS: Array<{
  value: SectionType;
  label: string;
  enabled: boolean;
}> = [
  { value: "standard", label: "Standard", enabled: true },
  { value: "repeatable", label: "Repeatable (arrays)", enabled: false },
  { value: "accordion", label: "Accordion", enabled: false },
  { value: "tabs", label: "Tabs", enabled: false },
  { value: "wizard-step", label: "Wizard step", enabled: false },
];

export function parseSectionLayout(
  layoutConfig: SectionLayoutConfig | Record<string, unknown> | null | undefined,
): Required<
  Pick<SectionLayoutConfig, "columns" | "collapsible" | "defaultExpanded">
> & {
  sectionType: SectionType;
  tooltipEnabled: boolean;
  density: SectionDensity;
  fieldGap: SectionFieldGap;
} {
  const raw = layoutConfig ?? {};
  const columns = raw.columns === 1 ? 1 : 2;
  const sectionType = (raw.sectionType as SectionType) ?? "standard";
  const densityRaw = raw.density;
  const density: SectionDensity =
    densityRaw === "compact" || densityRaw === "spacious"
      ? densityRaw
      : "comfortable";
  const gapRaw = raw.fieldGap;
  const fieldGap: SectionFieldGap =
    gapRaw === 12 || gapRaw === 16 || gapRaw === 32 ? gapRaw : 24;
  return {
    columns,
    collapsible: raw.collapsible === true,
    defaultExpanded: raw.defaultExpanded !== false,
    sectionType,
    tooltipEnabled: raw.tooltipEnabled === true,
    density,
    fieldGap,
  };
}

export function readSectionTooltipEnabled(
  layoutConfig: SectionLayoutConfig | Record<string, unknown> | null | undefined,
): boolean {
  return parseSectionLayout(layoutConfig).tooltipEnabled;
}

export function patchSectionTooltip(
  enabled: boolean,
  message: string,
): SectionSettingsPatch {
  return {
    tooltip: message.trim() || undefined,
    layoutConfig: { tooltipEnabled: enabled },
  };
}

export function defaultSectionLayoutConfig(): SectionLayoutConfig {
  return {
    columns: 2,
    collapsible: true,
    defaultExpanded: true,
    sectionType: "standard",
  };
}

export type SectionSettingsPatch = {
  title?: string;
  description?: string | null;
  tooltip?: string | null;
  layoutConfig?: SectionLayoutConfig;
};

export function mergeSectionSettingsPatch(
  prev: SectionSettingsPatch,
  next: SectionSettingsPatch,
): SectionSettingsPatch {
  return {
    ...prev,
    ...next,
    layoutConfig: next.layoutConfig
      ? { ...prev.layoutConfig, ...next.layoutConfig }
      : prev.layoutConfig,
  };
}
