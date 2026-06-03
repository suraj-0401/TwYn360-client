import type { FormulaParameterInput } from "@/types/formula";
import type { FormulaVariablePoolItem } from "@/modules/models/utils/formula-variable-pool";

const NUMERIC_DATA_TYPES = new Set(["number", "integer", "decimal"]);

function isNumericDataType(dataTypeCode?: string | null): boolean {
  if (!dataTypeCode) return true;
  return NUMERIC_DATA_TYPES.has(dataTypeCode.trim().toLowerCase());
}

export function normalizeFormulaParametersForMappings(
  parameters: FormulaParameterInput[],
  variablePool: FormulaVariablePoolItem[],
): FormulaParameterInput[] {
  if (parameters.length === 0) {
    return parameters;
  }

  const byInstanceId = new Map(
    variablePool
      .filter((item) => item.sourceType === "FACTOR_INSTANCE" && item.instanceId)
      .map((item) => [item.instanceId as string, item]),
  );

  return parameters.map((param) => {
    if (param.type !== "DYNAMIC") {
      return param;
    }

    const isFactorInstanceSource =
      !param.sourceType || param.sourceType === "FACTOR_INSTANCE";
    if (!isFactorInstanceSource || !param.instanceId) {
      return param;
    }

    const source = byInstanceId.get(param.instanceId);
    if (!source) {
      return param;
    }

    if (
      isNumericDataType(source.dataTypeCode) ||
      !source.mappedDerivedFactorId
    ) {
      return param;
    }

    return {
      ...param,
      sourceType: "DERIVED_FACTOR",
      instanceId: undefined,
      derivedFactorId: source.mappedDerivedFactorId,
    };
  });
}
