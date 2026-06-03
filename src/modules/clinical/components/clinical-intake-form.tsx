"use client";

import { DynamicClinicalSection } from "@/modules/clinical/components/workspace/dynamic-clinical-section";
import type { ClinicalIntakeSection } from "@/types/clinical-intake";

type ClinicalIntakeFormProps = {
  sections: ClinicalIntakeSection[];
  values: Record<string, unknown>;
  onValuesChange: (next: Record<string, unknown>) => void;
  /** How many sections start expanded (rest collapsed). Defaults to all open. */
  defaultOpenSections?: number;
};

export function ClinicalIntakeForm({
  sections,
  values,
  onValuesChange,
  defaultOpenSections,
}: ClinicalIntakeFormProps) {
  const openCount =
    defaultOpenSections === undefined
      ? sections.length
      : Math.max(0, defaultOpenSections);
  if (sections.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No factor sets are linked to this model yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sections.map((section, index) => (
        <DynamicClinicalSection
          key={section.factorSetId ?? section.slug}
          section={section}
          defaultOpen={index < openCount}
          values={values}
          onValuesChange={onValuesChange}
        />
      ))}
    </div>
  );
}
