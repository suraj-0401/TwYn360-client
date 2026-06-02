"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QueryErrorState } from "@/components/feedback";
import { executeModel, getModelRuntimePlan } from "@/services/runtime.service";
import type { RuntimeExecutionResult } from "@/types/runtime";

type ModelRuntimeTabProps = {
  modelId: string;
};

export function ModelRuntimeTab({ modelId }: ModelRuntimeTabProps) {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<RuntimeExecutionResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const planQuery = useQuery({
    queryKey: ["model-runtime-plan", modelId],
    queryFn: async () => (await getModelRuntimePlan(modelId)).data,
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const inputs: Record<string, number> = {};
      for (const req of planQuery.data?.requiredInputs ?? []) {
        const raw = inputValues[req.alias]?.trim();
        if (!raw) {
          throw new Error(`Enter a value for "${req.alias}"`);
        }
        const value = Number(raw);
        if (Number.isNaN(value)) {
          throw new Error(`"${req.alias}" must be a number`);
        }
        inputs[req.alias] = value;
      }
      return (await executeModel(modelId, inputs)).data;
    },
    onSuccess: (data) => {
      setResult(data);
      setRunError(null);
    },
    onError: (error: Error) => {
      setRunError(error.message);
    },
  });

  const readyOutcomes = useMemo(
    () => planQuery.data?.outcomes.filter((row) => row.runtimeReady) ?? [],
    [planQuery.data?.outcomes],
  );

  if (planQuery.isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-zinc-400">
        <Loader2 className="size-4 animate-spin" />
        Loading runtime plan…
      </p>
    );
  }

  if (planQuery.error) {
    return (
      <QueryErrorState
        error={planQuery.error}
        context={{ resource: "runtime plan" }}
        onRetry={() => planQuery.refetch()}
        isRetrying={planQuery.isRefetching}
      />
    );
  }

  const plan = planQuery.data!;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-zinc-100">Run model (Phase 1)</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Executes approved formulas with{" "}
          <span className="font-mono text-zinc-300">runtimeReady</span> in derived-factor
          dependency order, then outcomes. Requires simulation-service.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Runtime-ready formulas: {plan.runtimeReadyCount}
          {plan.derivedFactorOrder.length > 0 ? (
            <>
              {" · "}
              Order:{" "}
              {plan.derivedFactorOrder.map((row) => row.slug).join(" → ")}
            </>
          ) : null}
        </p>
      </div>

      {plan.runtimeReadyCount === 0 ? (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          No runtime-ready formulas yet. Validate in Formula Studio, submit for review,
          and approve to enable execution.
        </p>
      ) : (
        <>
          <section className="space-y-4 rounded-lg border border-white/10 bg-[#0f0f11] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Factor inputs
            </p>
            {plan.requiredInputs.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No factor-instance inputs required — formulas use only static defaults and
                derived factors.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {plan.requiredInputs.map((req) => (
                  <div key={req.alias} className="space-y-1.5">
                    <Label htmlFor={`runtime-input-${req.alias}`}>
                      {req.label ?? req.alias}
                      <span className="ml-1 font-mono text-zinc-500">({req.alias})</span>
                    </Label>
                    <Input
                      id={`runtime-input-${req.alias}`}
                      type="number"
                      step="any"
                      className="border-white/10 bg-[#121216]"
                      value={inputValues[req.alias] ?? ""}
                      onChange={(event) =>
                        setInputValues((prev) => ({
                          ...prev,
                          [req.alias]: event.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              size="sm"
              disabled={runMutation.isPending}
              onClick={() => runMutation.mutate()}
            >
              {runMutation.isPending ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              ) : (
                <Play className="mr-2 size-3.5" />
              )}
              Execute
            </Button>
            {runError ? <p className="text-sm text-red-400">{runError}</p> : null}
          </section>

          {result ? (
            <section className="space-y-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-cyan-200/80">
                Results
              </p>
              {result.derivedFactors.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs text-zinc-500">Derived factors</p>
                  <ul className="space-y-2 text-sm">
                    {result.derivedFactors.map((row) => (
                      <li
                        key={row.derivedFactorId}
                        className="flex justify-between gap-4 font-mono"
                      >
                        <span className="text-zinc-300">{row.displayName}</span>
                        <span className="text-cyan-200">{row.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {result.outcomes.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs text-zinc-500">Outcomes</p>
                  <ul className="space-y-2 text-sm">
                    {result.outcomes.map((row) => (
                      <li
                        key={row.outcomeId}
                        className="flex justify-between gap-4 font-mono"
                      >
                        <span className="text-zinc-300">{row.displayName}</span>
                        <span className="text-emerald-200">{row.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {readyOutcomes.length > 0 && result.outcomes.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  No outcome values returned — check outcome formulas are runtime-ready.
                </p>
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
