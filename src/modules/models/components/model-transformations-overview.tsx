"use client";

import { useMemo } from "react";
import type { DerivedFactorDefinitionDto } from "@/types/formula";
import type { ResolvedModelFactorInstance } from "@/types/model-factor-instance";
import { buildTransformationFlowRows } from "@/modules/models/utils/build-transformation-flow-rows";

type ModelTransformationsOverviewProps = {
  derivedFactors: DerivedFactorDefinitionDto[];
  factorInstances: ResolvedModelFactorInstance[];
  className?: string;
};

/** @deprecated Prefer `FeatureTransformationsFlow` in the Transformations tab. */
export function ModelTransformationsOverview({
  derivedFactors,
  factorInstances,
  className,
}: ModelTransformationsOverviewProps) {
  const rows = useMemo(
    () => buildTransformationFlowRows(derivedFactors, factorInstances),
    [derivedFactors, factorInstances],
  );

  if (rows.length === 0) {
    return (
      <p className={className ?? "text-xs text-[#71717a]"}>
        No transformation derived factors yet. Create a{" "}
        <span className="text-cyan-200/90">transformation</span> factor to convert enums to
        numeric features for formulas.
      </p>
    );
  }

  return (
    <div className={className}>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[#71717a]">
        Feature transformations
      </p>
      <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] uppercase tracking-wide text-[#52525b]">
              <th className="px-3 py-2 font-medium">Source factor (raw)</th>
              <th className="px-3 py-2 font-medium">Transformation</th>
              <th className="px-3 py-2 font-medium">Output factor (numeric)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-white/[0.06] last:border-0">
                <td className="px-3 py-2.5">
                  <p className="font-mono text-[#e4e4e7]">{row.sourceAlias}</p>
                  <p className="text-[10px] text-[#71717a]">{row.sourceLabel}</p>
                </td>
                <td className="px-3 py-2.5 text-[#a1a1aa]">
                  Categorical mapping
                  <span className="mt-0.5 block text-[10px] text-[#52525b]">
                    {row.mappingCount} mapping{row.mappingCount === 1 ? "" : "s"}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <p className="font-mono text-cyan-200/90">{row.outputAlias}</p>
                  <p className="text-[10px] text-[#71717a]">{row.outputLabel}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
