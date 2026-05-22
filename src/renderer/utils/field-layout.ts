import { cn } from "@/lib/utils";
import {
  parseSectionLayout,
  type SectionLayoutConfig,
} from "../section-metadata.registry";
import { formFieldStackClass } from "../form-styles";
import { fieldCellLayoutClass } from "../field-span";
import type { FieldDefinition, SectionDefinition } from "../types";

/** Horizontal + vertical rhythm between fields. */
const FIELD_GAP_CLASS: Record<12 | 16 | 24 | 32, string> = {
  12: "gap-x-4 gap-y-4",
  16: "gap-x-4 gap-y-5",
  24: "gap-x-5 gap-y-5",
  32: "gap-x-6 gap-y-6",
};

export function sectionGridClass(
  section: SectionDefinition,
  layoutConfig?: SectionLayoutConfig | Record<string, unknown> | null,
): string {
  const layout = parseSectionLayout(layoutConfig ?? section.layout);
  const gap = FIELD_GAP_CLASS[layout.fieldGap];
  return cn("grid grid-cols-12 items-start", gap);
}

export function sectionDensityPaddingClass(
  layoutConfig?: SectionLayoutConfig | Record<string, unknown> | null,
): string {
  const layout = parseSectionLayout(layoutConfig);
  switch (layout.density) {
    case "compact":
      return "px-5 py-4";
    case "spacious":
      return "px-7 py-6";
    default:
      return "px-6 py-5";
  }
}

export function fieldCellClass(definition: FieldDefinition): string {
  return cn(formFieldStackClass, "group", fieldCellLayoutClass(definition));
}
