import type {
  LookupFieldTypeMap,
  LookupMetadata,
  LookupValue,
} from "@/types/lookup";

export function parseLookupMetadata(
  metadata: LookupMetadata | null | undefined,
): LookupMetadata {
  if (!metadata) {
    return {};
  }
  return metadata;
}

type LookupValueLike = {
  code: string;
  metadata?: LookupMetadata | null | unknown;
};

export function getDataTypeMetadata(
  dataTypes: LookupValueLike[] | undefined,
  dataTypeCode: string,
): LookupMetadata {
  const selected = dataTypes?.find((item) => item.code === dataTypeCode);
  return parseLookupMetadata(selected?.metadata as LookupMetadata | null | undefined);
}

export function isUnitRequired(
  dataTypes: LookupValueLike[] | undefined,
  dataTypeCode: string,
): boolean {
  return Boolean(getDataTypeMetadata(dataTypes, dataTypeCode).unitRequired);
}

export function validationFieldTypesForDataType(
  dataTypeCode: string,
  metadata?: LookupMetadata,
): LookupFieldTypeMap | undefined {
  if (metadata?.fieldTypes && Object.keys(metadata.fieldTypes).length > 0) {
    return metadata.fieldTypes;
  }

  switch (dataTypeCode) {
    case "enum":
      return { options: "stringArray" };
    case "number":
      return { min: "number", max: "number", step: "number" };
    case "string":
      return { minLength: "number", maxLength: "number", pattern: "string" };
    case "date":
      return { minDate: "date", maxDate: "date" };
    default:
      return undefined;
  }
}

export function coerceValidationsForSubmit(
  validations: Record<string, unknown>,
  fieldTypes: LookupFieldTypeMap | undefined,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(validations)) {
    if (raw === "" || raw === undefined || raw === null) {
      continue;
    }

    const fieldType = fieldTypes?.[key];

    if (fieldType === "number") {
      const num = Number(raw);
      if (!Number.isNaN(num)) {
        result[key] = num;
      }
      continue;
    }

    if (fieldType === "stringArray") {
      result[key] = String(raw)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      continue;
    }

    result[key] = raw;
  }

  return result;
}
