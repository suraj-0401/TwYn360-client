"use client";

import { FieldLabel } from "@/components/shared/field-label";
import {
  formFieldStackClass,
  formHelperClass,
} from "@/renderer/form-styles";
import { cn } from "@/lib/utils";
import type { FieldDefinition } from "../types";
import {
  FieldComponentRuntime,
  useFieldRequired,
} from "./field-component-runtime";
import {
  isDisplayFieldType,
  normalizeFieldType,
} from "../field-metadata.registry";
import { useFormReadOnly } from "../context/form-read-only-context";
import { fieldCellClass } from "../utils/field-layout";

type FieldRendererProps = {
  definition: FieldDefinition;
  allFields: Record<string, FieldDefinition>;
  fieldDbId?: string;
  sectionDbId?: string;
  value: unknown;
  values: Record<string, unknown>;
  onFieldChange: (fieldId: string, value: unknown) => void;
  adminKey?: string;
  /** Parent grid cell supplies layout; only render field stack. */
  embedded?: boolean;
};

export function FieldRenderer({
  definition,
  allFields,
  fieldDbId,
  sectionDbId,
  value,
  values,
  onFieldChange,
  adminKey,
  embedded = false,
}: FieldRendererProps) {
  const readOnly = useFormReadOnly();
  const fieldType = normalizeFieldType(definition.fieldType);
  const required = useFieldRequired(definition, values, allFields);
  const rootClass = embedded
    ? formFieldStackClass
    : fieldCellClass(definition);

  const onChange = (next: unknown) => onFieldChange(definition.id, next);

  const content = (
    <div className={readOnly ? "pointer-events-none opacity-90" : undefined}>
      <FieldComponentRuntime
        definition={definition}
        value={value}
        values={values}
        allFields={allFields}
        onChange={onChange}
        adminKey={adminKey}
        required={required}
        fieldDbId={fieldDbId}
        sectionDbId={sectionDbId}
      />
    </div>
  );

  if (isDisplayFieldType(fieldType)) {
    return <div className={rootClass}>{content}</div>;
  }

  if (fieldType === "checkbox") {
    return <div className={rootClass}>{content}</div>;
  }

  if (fieldType === "lookup") {
    return (
      <div className={rootClass}>
        <FieldLabel
          htmlFor={definition.id}
          label={definition.label}
          required={required}
          tooltip={definition.tooltip}
        />
        {content}
      </div>
    );
  }

  if (fieldType === "dynamic-validations") {
    return <div className={rootClass}>{content}</div>;
  }

  const helperText = definition.config?.helperText;

  return (
    <div className={cn(rootClass, !embedded && "group")}>
      <FieldLabel
        htmlFor={definition.id}
        label={definition.label}
        required={required}
        tooltip={definition.tooltip}
      />
      {content}
      {helperText ? <p className={formHelperClass}>{helperText}</p> : null}
    </div>
  );
}
