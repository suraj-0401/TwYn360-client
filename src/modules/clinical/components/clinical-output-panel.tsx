"use client";

import { Loader2 } from "lucide-react";
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
  hasAttemptedSubmit?: boolean;
  canSubmit?: boolean;
  isReadOnly?: boolean;
  onSubmit?: () => void;
};

export function ClinicalOutputPanel({
  outcomes,
  runtimeReadyCount,
  result,
  executeState,
  executeError,
  hasAttemptedSubmit = false,
  canSubmit = false,
  isReadOnly = false,
  onSubmit,
}: ClinicalOutputPanelProps) {
  const isRunning = executeState === "running";
  const showResults = result !== null || isRunning;

  const outcomeValues = new Map(
    result?.outcomes.map((row) => [row.outcomeId, row.value] as const) ?? [],
  );

  const primaryOutcomeId = outcomes.find((row) => row.runtimeReady)?.outcomeId;

  if (outcomes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Results
        </p>
        {!isReadOnly && runtimeReadyCount > 0 && onSubmit ? (
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={!canSubmit || isRunning}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="size-3 animate-spin" aria-hidden />
            ) : null}
            {isRunning ? "Running…" : "Submit"}
          </button>
        ) : null}
      </div>

      {hasAttemptedSubmit && executeError ? (
        <p className="text-[11px] text-red-400">{executeError}</p>
      ) : null}

      {!showResults && runtimeReadyCount > 0 ? (
        <p className="text-[11px] text-zinc-600">
          Fill required fields, then click Submit to calculate.
        </p>
      ) : null}

      {runtimeReadyCount === 0 ? (
        <p className="text-[11px] text-zinc-600">Not available yet</p>
      ) : showResults ? (
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
      ) : null}
    </div>
  );
}
