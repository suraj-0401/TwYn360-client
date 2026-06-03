import type { DerivedFactorDefinitionDto } from "@/types/formula";
import type { ResolvedModelFactorInstance } from "@/types/model-factor-instance";
import { isTransformationDerivedFactor } from "@/modules/models/utils/derived-factor-segments";
import {
  getEnumOptionsFromInstance,
  syncMappingRowsFromEnumOptions,
} from "@/modules/models/utils/enum-options-from-instance";
import { slugToFormulaAlias } from "@/modules/models/utils/formula-variable-pool";

/** Same eligibility as the mapping wizard: enum intake factors only. */
export function isTransformationEligibleInstance(
  instance: ResolvedModelFactorInstance,
): boolean {
  return instance.resolved.dataTypeCode === "enum";
}

export type TransformationMatrixRow = {
  sourceInstance: ResolvedModelFactorInstance;
  transformation: DerivedFactorDefinitionDto | null;
};

export function buildTransformationMatrix(
  factorInstances: ResolvedModelFactorInstance[],
  derivedFactors: DerivedFactorDefinitionDto[],
): TransformationMatrixRow[] {
  const transformations = derivedFactors.filter(isTransformationDerivedFactor);
  const bySourceId = new Map<string, DerivedFactorDefinitionDto>();

  for (const row of transformations) {
    const sourceId = row.mappingConfig?.sourceFactorInstanceId;
    if (sourceId && !bySourceId.has(sourceId)) {
      bySourceId.set(sourceId, row);
    }
  }

  const eligible = factorInstances
    .filter(isTransformationEligibleInstance)
    .sort((a, b) =>
      a.resolved.displayName.localeCompare(b.resolved.displayName, undefined, {
        sensitivity: "base",
      }),
    );

  return eligible.map((sourceInstance) => ({
    sourceInstance,
    transformation: bySourceId.get(sourceInstance.id) ?? null,
  }));
}

export function collectTransformationSlugs(
  derivedFactors: DerivedFactorDefinitionDto[],
): Set<string> {
  return new Set(derivedFactors.map((row) => row.slug.trim().toLowerCase()));
}

export function suggestTransformationSlug(
  sourceSlug: string,
  takenSlugs: Set<string>,
): string {
  const normalized = sourceSlug.trim().toLowerCase().replace(/-/g, "_");
  const base = normalized.endsWith("_numeric")
    ? normalized
    : `${normalized}_numeric`;
  let candidate = base;
  let suffix = 2;
  while (takenSlugs.has(candidate)) {
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function buildInitialMappingConfigForSource(
  sourceInstance: ResolvedModelFactorInstance,
) {
  const options = getEnumOptionsFromInstance(sourceInstance);
  const rows = syncMappingRowsFromEnumOptions([], options);
  return {
    sourceFactorInstanceId: sourceInstance.id,
    mappings: rows.map((row) => ({
      key: row.key,
      value: Number(row.value),
    })),
    fallbackValue: 0,
    overrides: [] as [],
  };
}

export function formatSourceFactorLabel(instance: ResolvedModelFactorInstance): string {
  return slugToFormulaAlias(instance.factor.slug);
}
