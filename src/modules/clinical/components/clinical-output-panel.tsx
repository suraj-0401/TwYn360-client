"use client";

import type { ClinicalExecuteState } from "@/modules/clinical/hooks/use-clinical-live-execute";
import { OutputMetricCard } from "@/modules/clinical/components/workspace/output-metric-card";
import type { ClinicalIntakeOutcomeOutput } from "@/types/clinical-intake";
import type { RuntimeExecutionResult } from "@/types/runtime";

type ClinicalOutputPanelProps = {
  outcomes: ClinicalIntakeOutcomeOutput[];
  runtimeReadyCount: number;
  result: RuntimeExecutionResult | null;
  executeState: ClinicalExecuteState;
  executeError: string | null;
};

export function ClinicalOutputPanel({
  outcomes,
  runtimeReadyCount,
  result,
  executeState,
  executeError,
}: ClinicalOutputPanelProps) {
  const isRunning = executeState === "running" || executeState === "pending";

  const outcomeValues = new Map(
    result?.outcomes.map((row) => [row.outcomeId, row.value] as const) ?? [],
  );

  const primaryOutcomeId = outcomes.find((row) => row.runtimeReady)?.outcomeId;

  if (outcomes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        Results
      </p>

      {executeError ? (
        <p className="text-[11px] text-red-400">{executeError}</p>
      ) : null}

      {runtimeReadyCount === 0 ? (
        <p className="text-[11px] text-zinc-600">Not available yet</p>
      ) : (
        <div className="space-y-2">
          {outcomes.map((row) => (
            <OutputMetricCard
              key={row.outcomeId}
              label={row.displayName}
              unitCode={row.unitCode}
              unitDisplayLabel={row.unitDisplayLabel}
              value={
                row.runtimeReady
                  ? (outcomeValues.get(row.outcomeId) ?? null)
                  : null
              }
              runtimeReady={row.runtimeReady}
              isRunning={isRunning}
              variant={
                row.outcomeId === primaryOutcomeId ? "primary" : "secondary"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
