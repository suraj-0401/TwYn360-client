import type { DerivedFactorDefinitionDto } from "@/types/formula";
import type { ResolvedModelFactorInstance } from "@/types/model-factor-instance";
import { slugToFormulaAlias } from "@/modules/models/utils/formula-variable-pool";
import { transformationMappingStatus } from "@/modules/models/utils/derived-factor-segments";

export type TransformationFlowRow = {
  id: string;
  sourceAlias: string;
  sourceLabel: string;
  outputAlias: string;
  outputLabel: string;
  status: "ready" | "incomplete";
  mappingCount: number;
};

export function buildTransformationFlowRows(
  derivedFactors: DerivedFactorDefinitionDto[],
  factorInstances: ResolvedModelFactorInstance[],
): TransformationFlowRow[] {
  const instanceById = new Map(factorInstances.map((row) => [row.id, row] as const));

  return derivedFactors
    .filter((row) => row.derivedFactorType === "categorical_mapping")
    .map((derived) => {
      const sourceId = derived.mappingConfig?.sourceFactorInstanceId;
      const source = sourceId ? instanceById.get(sourceId) : undefined;
      return {
        id: derived.id,
        sourceAlias: source ? slugToFormulaAlias(source.factor.slug) : "—",
        sourceLabel: source
          ? source.resolved.displayName
          : "Source not linked",
        outputAlias: slugToFormulaAlias(derived.slug),
        outputLabel: derived.displayName,
        status: transformationMappingStatus(derived),
        mappingCount: derived.mappingConfig?.mappings?.length ?? 0,
      };
    });
}
