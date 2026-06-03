"use client";

import { FORMULA_PIPELINE_LAYERS } from "@/modules/models/utils/formula-numeric-pool";

type FormulaPipelineCalloutProps = {
  compact?: boolean;
};

export function FormulaPipelineCallout({ compact = false }: FormulaPipelineCalloutProps) {
  return (
    <div
      className={
        compact
          ? "rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[11px] text-[#71717a]"
          : "rounded-xl border border-cyan-500/15 bg-cyan-500/5 px-4 py-3 text-xs text-[#a1a1aa]"
      }
    >
      <p className={compact ? "text-[10px] uppercase tracking-wide text-cyan-200/80" : "font-medium text-cyan-100/90"}>
        Layered model
      </p>
      <ol className={`mt-2 space-y-1 ${compact ? "list-none" : "list-decimal pl-4"}`}>
        {FORMULA_PIPELINE_LAYERS.map((layer, index) => (
          <li key={layer}>
            {compact ? (
              <span>
                <span className="text-[#52525b]">{index + 1}.</span> {layer}
              </span>
            ) : (
              layer
            )}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[10px] text-[#52525b]">
        Do not combine enum mapping and math in one derived factor. Use separate transformation
        and derived factors.
      </p>
    </div>
  );
}
