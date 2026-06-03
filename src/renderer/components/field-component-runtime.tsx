"use client";

import { RadioPills } from "@/components/form/radio-pills";
import { RatingScale } from "@/components/form/rating-scale";
import { FieldLabel } from "@/components/shared/field-label";
import { TooltipInfoTrigger } from "@/components/ui/tooltip";
import {
  formInputClass,
  formSelectClass,
  formTextareaClass,
} from "@/renderer/form-styles";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { resolveLookupFromField } from "../lookup-field.metadata";
import { isUnitRequired } from "@/lib/lookup-metadata";
import { DynamicValidationFields } from "./dynamic-validation-fields";
import { resolveDataTypeFieldId } from "@/modules/factors/utils/factor-workspace-values";
import { LookupField } from "@/modules/lookups/components/lookup-field";
import { useCollectionValues } from "@/modules/lookups/hooks/use-collection-values";
import { useWorkspaceEdit } from "../context/workspace-edit-context";
import type { FieldDefinition } from "../types";
import {
  isDisplayFieldType,
  normalizeFieldType,
  resolveFieldOptions,
} from "../field-metadata.registry";
import { rendererFieldIdMatchesKey } from "../utils/field-keys";

export type FieldRenderContext = {
  definition: FieldDefinition;
  value: unknown;
  values: Record<string, unknown>;
  allFields?: Record<string, FieldDefinition>;
  onChange: (value: unknown) => void;
  adminKey?: string;
  required: boolean;
  fieldDbId?: string;
  sectionDbId?: string;
};

function resolveRequired(
  definition: FieldDefinition,
  values: Record<string, unknown>,
  dataTypes: ReturnType<typeof useCollectionValues>["data"],
): boolean {
  if (isDisplayFieldType(normalizeFieldType(definition.fieldType))) {
    return false;
  }
  if (definition.dynamicRequiredFrom) {
    const sourceCode = String(values[definition.dynamicRequiredFrom] ?? "");
    return isUnitRequired(dataTypes, sourceCode);
  }
  return Boolean(definition.required);
}

export function useFieldRequired(
  definition: FieldDefinition,
  values: Record<string, unknown>,
  allFields: Record<string, FieldDefinition>,
): boolean {
  const edit = useWorkspaceEdit();
  if (edit) {
    return Boolean(definition.required);
  }

  const depKey = definition.dynamicRequiredFrom;
  if (!depKey) {
    return Boolean(definition.required);
  }

  const depField = allFields[depKey];
  const dataTypeSource = depField
    ? (resolveLookupFromField(depField)?.collectionId ?? "")
    : "";
  const { data: dataTypes } = useCollectionValues(dataTypeSource);
  return resolveRequired(definition, values, dataTypes);
}

/** Metadata-driven component runtime — maps fieldType → React UI. */
export function FieldComponentRuntime({
  definition,
  value,
  values,
  allFields,
  onChange,
  adminKey,
  required,
  fieldDbId,
  sectionDbId,
}: FieldRenderContext) {
  const edit = useWorkspaceEdit();
  const fieldType = normalizeFieldType(definition.fieldType);
  const options = resolveFieldOptions(definition);
  const stringValue =
    value === undefined || value === null ? "" : String(value);
  const cfg = definition.config ?? {};
  const validations = definition.validations ?? {};

  const min =
    typeof validations.min === "number"
      ? validations.min
      : typeof cfg.min === "number"
        ? cfg.min
        : undefined;
  const max =
    typeof validations.max === "number"
      ? validations.max
      : typeof cfg.max === "number"
        ? cfg.max
        : undefined;

  switch (fieldType) {
    case "heading": {
      const level = cfg.level ?? 3;
      const hint = definition.tooltip?.trim();
      const title = (
        <span className="inline-flex items-center gap-1.5">
          {definition.label}
          {hint ? <TooltipInfoTrigger label={hint} side="top" /> : null}
        </span>
      );
      if (level === 1) {
        return <h1 className="text-[15px] font-semibold text-[#f5f5f5]">{title}</h1>;
      }
      if (level === 2) {
        return <h2 className="text-[14px] font-semibold text-[#f5f5f5]">{title}</h2>;
      }
      if (level === 4) {
        return <h4 className="text-[12px] font-medium text-[#d4d4d8]">{title}</h4>;
      }
      return <h3 className="text-[13px] font-medium text-[#e4e4e7]">{title}</h3>;
    }

    case "divider":
      return (
        <div className="py-2">
          <hr className="border-zinc-200 dark:border-zinc-700" />
          {definition.label && definition.label !== "Divider" ? (
            <p className="mt-2 text-xs text-muted-foreground">{definition.label}</p>
          ) : null}
        </div>
      );

    case "text":
      return (
        <Input
          id={definition.id}
          className={formInputClass}
          placeholder={definition.placeholder}
          value={stringValue}
          maxLength={cfg.maxLength}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      );

    case "textarea":
      return (
        <Textarea
          id={definition.id}
          className={formTextareaClass}
          placeholder={definition.placeholder}
          rows={cfg.rows ?? 3}
          maxLength={cfg.maxLength}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      );

    case "number":
      return (
        <Input
          id={definition.id}
          type="number"
          className={formInputClass}
          placeholder={definition.placeholder}
          value={stringValue}
          min={min}
          max={max}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          required={required}
        />
      );

    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <input
            id={definition.id}
            type="checkbox"
            className="h-4 w-4 rounded border-white/10 bg-transparent accent-[#a1a1aa]"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <FieldLabel
            htmlFor={definition.id}
            label={definition.label}
            tooltip={definition.tooltip}
          />
        </div>
      );

    case "select":
      return (
        <select
          id={definition.id}
          className={formSelectClass}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        >
          <option value="">{definition.placeholder ?? "Select..."}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case "radio":
      return (
        <RadioPills
          name={definition.id}
          value={stringValue}
          options={options}
          onChange={onChange}
        />
      );

    case "rating": {
      const maxRating =
        typeof cfg.maxRating === "number" ? cfg.maxRating : 5;
      const minRating =
        typeof cfg.minRating === "number" ? cfg.minRating : 1;
      const current =
        typeof value === "number"
          ? value
          : stringValue
            ? Number(stringValue)
            : undefined;
      return (
        <RatingScale
          min={minRating}
          max={maxRating}
          value={current}
          onChange={onChange}
        />
      );
    }

    case "lookup": {
      const lookup = resolveLookupFromField(definition);
      const configureFieldId =
        fieldDbId ??
        (edit && sectionDbId
          ? edit.sections
              .find((s) => s.id === sectionDbId)
              ?.fields.find((f) =>
                rendererFieldIdMatchesKey(definition.id, f.fieldKey),
              )?.id
          : null) ??
        edit?.selectedFieldId ??
        null;
      const configureSectionId = sectionDbId ?? edit?.selectedSectionId ?? null;

      if (edit && !lookup?.collectionId) {
        return (
          <div
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              if (configureFieldId && configureSectionId) {
                edit.selectField(configureFieldId, configureSectionId);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                if (configureFieldId && configureSectionId) {
                  edit.selectField(configureFieldId, configureSectionId);
                }
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className={cn(formInputClass, "border-dashed text-[#f4f4f5]/50")}>
              {definition.placeholder ?? "Select…"}
            </div>
          </div>
        );
      }

      if (!lookup?.collectionId) {
        return (
          <p className="text-sm text-muted-foreground">
            Configure a collection for this lookup field.
          </p>
        );
      }

      return (
        <LookupField
          key={definition.id}
          collectionId={lookup.collectionId}
          label={definition.label}
          value={stringValue}
          onChange={(code) => onChange(code)}
          required={required}
          allowCreate={lookup.allowCreate !== false}
          searchable={lookup.searchable !== false}
          asyncLoading={lookup.asyncLoading === true}
          placeholder={definition.placeholder}
          adminKey={adminKey}
          hideLabel
        />
      );
    }

    case "date":
      return (
        <Input
          id={definition.id}
          type="date"
          className={formInputClass}
          value={stringValue}
          min={cfg.minDate}
          max={cfg.maxDate}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      );

    case "dynamic-validations": {
      const validationsState =
        (values.validations as Record<string, unknown>) ?? {};
      const dataTypeFieldId = allFields
        ? resolveDataTypeFieldId(allFields)
        : undefined;
      const dataTypeCode = dataTypeFieldId
        ? String(values[dataTypeFieldId] ?? "")
        : "";
      const dataTypeField = dataTypeFieldId
        ? allFields?.[dataTypeFieldId]
        : undefined;
      const dataTypeCollectionId = dataTypeField
        ? (resolveLookupFromField(dataTypeField)?.collectionId ?? "")
        : "";

      return (
        <DynamicValidationFields
          dataTypeCode={dataTypeCode}
          dataTypeCollectionId={dataTypeCollectionId}
          validations={validationsState}
          includeAllowedValues={false}
          allowedValuesPlaceholder="Comma-separated enum values"
          onValidationChange={(fieldKey, fieldValue) =>
            onChange({ ...validationsState, [fieldKey]: fieldValue })
          }
        />
      );
    }

    default:
      return (
        <p className="text-sm text-amber-700">
          Unsupported field type: {definition.fieldType}
        </p>
      );
  }
}

