"use client";

import { useMemo } from "react";
import { CollapsibleClinicalCard } from "@/modules/clinical/components/workspace/collapsible-clinical-card";
import { ClinicalFactorField } from "@/modules/clinical/components/workspace/clinical-factor-field";
import { instanceToClinicalField } from "@/modules/clinical/utils/instance-to-clinical-field";
import type { ClinicalIntakeSection } from "@/types/clinical-intake";

type DynamicClinicalSectionProps = {
  section: ClinicalIntakeSection;
  defaultOpen?: boolean;
  values: Record<string, unknown>;
  onValuesChange: (next: Record<string, unknown>) => void;
};

export function DynamicClinicalSection({
  section,
  defaultOpen = true,
  values,
  onValuesChange,
}: DynamicClinicalSectionProps) {
  const fields = useMemo(
    () =>
      Object.fromEntries(
        section.inputs.map((input) => [
          input.alias,
          instanceToClinicalField(input),
        ]),
      ),
    [section.inputs],
  );

  return (
    <CollapsibleClinicalCard title={section.title} defaultOpen={defaultOpen}>
      <div className="grid gap-3 sm:grid-cols-2">
        {section.inputs.map((input) => (
          <ClinicalFactorField
            key={input.instanceId}
            input={input}
            definition={fields[input.alias]!}
            allFields={fields}
            value={values[input.alias]}
            values={values}
            onFieldChange={(fieldId, nextValue) => {
              onValuesChange({ ...values, [fieldId]: nextValue });
            }}
          />
        ))}
      </div>
    </CollapsibleClinicalCard>
  );
}
