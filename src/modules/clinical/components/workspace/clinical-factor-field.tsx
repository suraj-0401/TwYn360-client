"use client";

import {
  FieldComponentRuntime,
  useFieldRequired,
} from "@/renderer/components/field-component-runtime";
import type { FieldDefinition } from "@/renderer/types";
import { cn } from "@/lib/utils";
import { clinicalUnitSuffix } from "@/modules/clinical/utils/clinical-unit-label";
import type { ClinicalIntakeInput } from "@/types/clinical-intake";

type ClinicalFactorFieldProps = {
  input: ClinicalIntakeInput;
  definition: FieldDefinition;
  allFields: Record<string, FieldDefinition>;
  value: unknown;
  values: Record<string, unknown>;
  onFieldChange: (fieldId: string, value: unknown) => void;
};

export function ClinicalFactorField({
  input,
  definition,
  allFields,
  value,
  values,
  onFieldChange,
}: ClinicalFactorFieldProps) {
  const required = useFieldRequired(definition, values, allFields);
  const unit = clinicalUnitSuffix(input.unitCode, input.unitDisplayLabel);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={definition.id}
          className="text-[12px] font-medium text-zinc-200"
        >
          {definition.label}
          {required ? (
            <span className="ml-0.5 text-red-400/90" aria-hidden>
              *
            </span>
          ) : null}
        </label>
        {unit ? (
          <span className="shrink-0 text-[10px] text-zinc-600">{unit}</span>
        ) : null}
      </div>
      <div
        className={cn(
          "rounded-md border border-white/[0.05] bg-white/[0.02]",
          "focus-within:border-emerald-500/25 focus-within:ring-1 focus-within:ring-emerald-500/10",
        )}
      >
        <div className="px-2.5 py-1.5">
          <FieldComponentRuntime
            definition={definition}
            value={value}
            values={values}
            allFields={allFields}
            onChange={(next) => onFieldChange(definition.id, next)}
            required={required}
          />
        </div>
      </div>
    </div>
  );
}
