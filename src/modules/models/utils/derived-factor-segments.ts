import type { DerivedFactorDefinitionDto } from "@/types/formula";

/** Matches backend `DERIVED_FACTOR_TYPE.CATEGORICAL_MAPPING`. */
export const DERIVED_FACTOR_TYPE_CATEGORICAL_MAPPING = "categorical_mapping" as const;

export function isTransformationDerivedFactor(
  row: DerivedFactorDefinitionDto,
): boolean {
  return row.derivedFactorType === DERIVED_FACTOR_TYPE_CATEGORICAL_MAPPING;
}

export function isFormulaDerivedFactor(row: DerivedFactorDefinitionDto): boolean {
  return !isTransformationDerivedFactor(row);
}

export function partitionDerivedFactors(items: DerivedFactorDefinitionDto[]) {
  const transformations: DerivedFactorDefinitionDto[] = [];
  const formulaFactors: DerivedFactorDefinitionDto[] = [];

  for (const item of items) {
    if (isTransformationDerivedFactor(item)) {
      transformations.push(item);
    } else {
      formulaFactors.push(item);
    }
  }

  return { transformations, formulaFactors };
}

export function transformationMappingStatus(
  row: DerivedFactorDefinitionDto,
): "ready" | "incomplete" {
  const config = row.mappingConfig;
  if (
    config?.sourceFactorInstanceId &&
    Array.isArray(config.mappings) &&
    config.mappings.length > 0
  ) {
    return "ready";
  }
  return "incomplete";
}
