"use client";

import { Loader2, Play } from "lucide-react";
import { OutputMetricCard } from "@/modules/clinical/components/workspace/output-metric-card";
import { formatClinicalValue } from "@/modules/clinical/utils/format-clinical-value";
import { shortenOutcomeLabel } from "@/modules/clinical/utils/shorten-display-label";
import type { ClinicalIntakeOutcomeOutput } from "@/types/clinical-intake";
import type { RuntimeExecutionResult } from "@/types/runtime";

type RuntimeResultsPanelProps = {
  outcomes: ClinicalIntakeOutcomeOutput[];
  runtimeReadyCount: number;
  result: RuntimeExecutionResult | null;
  isRunning: boolean;
  executeError: string | null;
  hasAttemptedRun: boolean;
  canRun: boolean;
  missingCount: number;
  onRun: () => void;
};

export function RuntimeResultsPanel({
  outcomes,
  runtimeReadyCount,
  result,
  isRunning,
  executeError,
  hasAttemptedRun,
  canRun,
  missingCount,
  onRun,
}: RuntimeResultsPanelProps) {
  const showValues = result !== null || isRunning;
  const outcomeValues = new Map(
    result?.outcomes.map((row) => [row.outcomeId, row.value] as const) ?? [],
  );
  const primaryOutcomeId = outcomes.find((row) => row.runtimeReady)?.outcomeId;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/[0.06] bg-[#090b0e] p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Results
        </h3>
        {runtimeReadyCount > 0 ? (
          <button
            type="button"
            onClick={onRun}
            disabled={!canRun || isRunning}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Play className="size-3.5" aria-hidden />
            )}
            {isRunning ? "Running…" : "Run"}
          </button>
        ) : null}
      </div>

      {runtimeReadyCount === 0 ? (
        <p className="text-xs text-zinc-500">Approve formulas to enable run.</p>
      ) : null}

      {missingCount > 0 ? (
        <p className="text-xs text-amber-200/90">
          {missingCount} required field{missingCount === 1 ? "" : "s"} missing
        </p>
      ) : null}

      {hasAttemptedRun && executeError ? (
        <p className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1.5 text-xs text-red-300">
          {executeError}
        </p>
      ) : null}

      {!showValues && runtimeReadyCount > 0 && missingCount === 0 ? (
        <p className="text-xs text-zinc-500">Enter inputs, then click Run.</p>
      ) : null}

      {!showValues && runtimeReadyCount > 0 && missingCount > 0 ? (
        <p className="text-xs text-zinc-500">Complete required fields to run.</p>
      ) : null}

      {showValues && result && result.derivedFactors.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
            Derived factors
          </p>
          <ul className="max-h-40 space-y-1 overflow-y-auto overscroll-y-contain">
            {result.derivedFactors.map((row) => (
              <li
                key={row.derivedFactorId}
                className="flex items-baseline justify-between gap-2 rounded-md bg-white/[0.02] px-2 py-1.5 text-xs"
              >
                <span className="truncate text-zinc-400">
                  {shortenOutcomeLabel(row.displayName)}
                </span>
                <span className="shrink-0 font-mono tabular-nums text-cyan-200">
                  {formatClinicalValue(row.value, row.unitCode, null)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {outcomes.length > 0 ? (
        <div className="space-y-2">
          {result && result.derivedFactors.length > 0 ? (
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
              Outcomes
            </p>
          ) : null}
          {showValues ? (
            outcomes.map((row) => (
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
            ))
          ) : (
            outcomes.map((row) => (
              <div
                key={row.outcomeId}
                className="rounded-md bg-white/[0.02] px-2.5 py-2"
              >
                <p className="text-[11px] text-zinc-500">
                  {shortenOutcomeLabel(row.displayName)}
                </p>
                <p className="mt-1 font-mono text-sm text-zinc-600">—</p>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
