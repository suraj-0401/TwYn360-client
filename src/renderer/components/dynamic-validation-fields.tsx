"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldLabel } from "@/components/shared/field-label";
import { cn } from "@/lib/utils";
import { formInputClass, formTextareaClass } from "@/renderer/form-styles";
import { useCollectionValues } from "@/modules/lookups/hooks/use-collection-values";
import { getDataTypeMetadata } from "@/lib/lookup-metadata";
import type { LookupFieldTypeMap } from "@/types/lookup";

const VALIDATION_FIELD_LABELS: Record<string, string> = {
  options: "Enum options",
  minLength: "Min length",
  maxLength: "Max length",
  pattern: "Pattern",
  min: "Minimum",
  max: "Maximum",
  minDate: "Min date",
  maxDate: "Max date",
};

function validationFieldLabel(field: string): string {
  return VALIDATION_FIELD_LABELS[field] ?? field;
}

function isStringArrayField(
  field: string,
  fieldTypes: LookupFieldTypeMap | undefined,
): boolean {
  return fieldTypes?.[field] === "stringArray" || field === "options";
}

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
  const fieldTypes = metadata.fieldTypes;

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
        <div
          key={field}
          className={cn(
            "space-y-1",
            isStringArrayField(field, fieldTypes) && "sm:col-span-2",
          )}
        >
          <FieldLabel
            htmlFor={`validation-${field}`}
            label={validationFieldLabel(field)}
            required={field === "options" && metadata.requiresAllowedValues}
          />
          {isStringArrayField(field, fieldTypes) ? (
            <Textarea
              id={`validation-${field}`}
              className={formTextareaClass}
              placeholder="e.g. negative, positive, unknown"
              value={String(validations[field] ?? "")}
              onChange={(e) => onValidationChange(field, e.target.value)}
            />
          ) : (
            <Input
              id={`validation-${field}`}
              className={formInputClass}
              placeholder="Optional"
              value={String(validations[field] ?? "")}
              onChange={(e) => onValidationChange(field, e.target.value)}
            />
          )}
        </div>
      ))}

      {showAllowedValues && onAllowedValuesChange ? (
        <div className="space-y-1 sm:col-span-2">
          <FieldLabel
            htmlFor="allowed-values"
            label="Allowed values (subset)"
            tooltip="Optional. Use Enum options above, or list allowed values here (comma-separated)."
          />
          <Textarea
            id="allowed-values"
            className={formTextareaClass}
            placeholder={
              allowedValuesPlaceholder ??
              "e.g. negative, positive (optional if Enum options is set)"
            }
            value={allowedValues ?? ""}
            onChange={(e) => onAllowedValuesChange(e.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}
