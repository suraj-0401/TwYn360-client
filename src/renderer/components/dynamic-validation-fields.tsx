"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/shared/field-label";
import { formInputClass, formTextareaClass } from "@/renderer/form-styles";
import { useCollectionValues } from "@/modules/lookups/hooks/use-collection-values";
import { getDataTypeMetadata } from "@/lib/lookup-metadata";

type DynamicValidationFieldsProps = {
  dataTypeCode: string;
  dataTypeCollectionId: string;
  validations: Record<string, unknown>;
  allowedValues?: string;
  allowedValuesPlaceholder?: string;
  includeAllowedValues?: boolean;
  onValidationChange: (field: string, value: string) => void;
  onAllowedValuesChange?: (value: string) => void;
};

export function DynamicValidationFields({
  dataTypeCode,
  dataTypeCollectionId,
  validations,
  allowedValues,
  allowedValuesPlaceholder,
  includeAllowedValues = true,
  onValidationChange,
  onAllowedValuesChange,
}: DynamicValidationFieldsProps) {
  const { data: dataTypes } = useCollectionValues(dataTypeCollectionId);

  const metadata = getDataTypeMetadata(dataTypes, dataTypeCode);
  const fields = metadata.validationFields ?? [];

  if (!dataTypeCode) {
    return (
      <p className="text-[12px] text-[#71717a]">Choose a data type first.</p>
    );
  }

  const showAllowedValues =
    includeAllowedValues && metadata.requiresAllowedValues;

  if (fields.length === 0 && !showAllowedValues) {
    return (
      <p className="text-[12px] text-[#71717a]">No extra rules for this type.</p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field} className="space-y-1">
          <FieldLabel htmlFor={`validation-${field}`} label={field} />
          <Input
            id={`validation-${field}`}
            className={formInputClass}
            placeholder="Optional"
            value={String(validations[field] ?? "")}
            onChange={(e) => onValidationChange(field, e.target.value)}
          />
        </div>
      ))}

      {showAllowedValues && onAllowedValuesChange ? (
        <div className="space-y-1 sm:col-span-2">
          <FieldLabel htmlFor="allowed-values" label="Allowed values" required />
          <Textarea
            id="allowed-values"
            className={formTextareaClass}
            placeholder={allowedValuesPlaceholder}
            value={allowedValues ?? ""}
            onChange={(e) => onAllowedValuesChange(e.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}
