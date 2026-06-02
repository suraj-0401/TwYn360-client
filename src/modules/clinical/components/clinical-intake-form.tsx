"use client";

import { DynamicClinicalSection } from "@/modules/clinical/components/workspace/dynamic-clinical-section";
import type { ClinicalIntakeSection } from "@/types/clinical-intake";

type ClinicalIntakeFormProps = {
  sections: ClinicalIntakeSection[];
  values: Record<string, unknown>;
  onValuesChange: (next: Record<string, unknown>) => void;
};

export function ClinicalIntakeForm({
  sections,
  values,
  onValuesChange,
}: ClinicalIntakeFormProps) {
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
          defaultOpen={index < 2}
          values={values}
          onValuesChange={onValuesChange}
        />
      ))}
    </div>
  );
}
