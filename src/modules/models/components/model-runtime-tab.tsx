"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { QueryErrorState } from "@/components/feedback";
import { ClinicalIntakeForm } from "@/modules/clinical/components/clinical-intake-form";
import { ClinicalTestValuesPanel } from "@/modules/clinical/components/clinical-test-values-panel";
import { filterClinicalSections } from "@/modules/clinical/utils/filter-clinical-sections";
import { coerceRuntimeInputs } from "@/modules/clinical/utils/coerce-runtime-inputs";
import { RuntimeResultsPanel } from "@/modules/models/components/runtime-results-panel";
import { getClinicalIntakeSchema } from "@/services/clinical-intake.service";
import { executeModel } from "@/services/runtime.service";
import type { ClinicalIntakeSchema } from "@/types/clinical-intake";
import type { RuntimeExecutionResult } from "@/types/runtime";

type ModelRuntimeTabProps = {
  modelId: string;
};

function defaultValuesFromSchema(
  schema: ClinicalIntakeSchema,
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const input of schema.inputs) {
    if (input.defaultValue !== null && input.defaultValue !== undefined) {
      next[input.alias] = input.defaultValue;
    }
  }
  return next;
}

function defaultOpenSectionCount(inputCount: number): number {
  if (inputCount > 40) {
    return 0;
  }
  if (inputCount > 15) {
    return 1;
  }
  if (inputCount > 8) {
    return 2;
  }
  return 99;
}

export function ModelRuntimeTab({ modelId }: ModelRuntimeTabProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<RuntimeExecutionResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [hasAttemptedRun, setHasAttemptedRun] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const schemaQuery = useQuery({
    queryKey: ["clinical-intake-schema", modelId],
    queryFn: async () => (await getClinicalIntakeSchema(modelId)).data,
  });

  const schema = schemaQuery.data;

  useEffect(() => {
    if (!schema) {
      return;
    }
    setValues(defaultValuesFromSchema(schema));
    setResult(null);
    setRunError(null);
    setHasAttemptedRun(false);
    setSearchQuery("");
  }, [schema?.model.id, schema?.inputs.length]);

  const valuesKey = useMemo(() => JSON.stringify(values), [values]);

  useEffect(() => {
    if (!schema) {
      return;
    }
    setResult(null);
    setRunError(null);
    setHasAttemptedRun(false);
  }, [valuesKey, schema]);

  const { missingLabels } = useMemo(
    () => coerceRuntimeInputs(schema?.inputs ?? [], values),
    [schema?.inputs, values],
  );

  const filteredSections = useMemo(() => {
    if (!schema) {
      return [];
    }
    return filterClinicalSections(schema.sections, searchQuery);
  }, [schema, searchQuery]);

  const runMutation = useMutation({
    mutationFn: async () => {
      if (!schema) {
        throw new Error("Intake schema not loaded.");
      }
      const { bindings, missingLabels: missing } = coerceRuntimeInputs(
        schema.inputs,
        values,
      );
      if (missing.length > 0) {
        throw new Error(`Complete required fields (${missing.length} missing).`);
      }
      return (await executeModel(modelId, bindings)).data;
    },
    onSuccess: (data) => {
      setResult(data);
      setRunError(null);
    },
    onError: (error: Error) => {
      setResult(null);
      setRunError(error.message);
    },
  });

  const handleRun = () => {
    setHasAttemptedRun(true);
    runMutation.mutate();
  };

  const inputCount = schema?.inputs.length ?? 0;
  const canRun =
    Boolean(schema) &&
    (schema?.runtimeReadyCount ?? 0) > 0 &&
    missingLabels.length === 0 &&
    !runMutation.isPending;

  if (schemaQuery.isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-zinc-400">
        <Loader2 className="size-4 animate-spin" />
        Loading…
      </p>
    );
  }

  if (schemaQuery.error) {
    return (
      <QueryErrorState
        error={schemaQuery.error}
        context={{ resource: "run inputs" }}
        onRetry={() => schemaQuery.refetch()}
        isRetrying={schemaQuery.isRefetching}
      />
    );
  }

  if (!schema) {
    return null;
  }

  if (schema.runtimeReadyCount === 0) {
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        No approved formulas yet. Approve formulas in Formula Studio to run this
        model.
      </div>
    );
  }

  return (
    <div className="flex min-h-[min(32rem,70vh)] flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_min(300px,340px)] lg:items-start lg:gap-5">
      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-xs text-zinc-400">
            {inputCount} input{inputCount === 1 ? "" : "s"}
          </span>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-200/90">
            {schema.runtimeReadyCount} formula
            {schema.runtimeReadyCount === 1 ? "" : "s"} ready
          </span>
        </div>

        {inputCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-zinc-500" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search fields…"
                className="h-8 w-full rounded-md border border-white/10 bg-[#0f0f11] py-1 pr-8 pl-8 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-cyan-500/40 focus:outline-none"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-300"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
            <ClinicalTestValuesPanel
              modelSlug={schema.model.slug}
              inputs={schema.inputs}
              onApplyExample={(next) =>
                setValues((prev) => ({ ...prev, ...next }))
              }
            />
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain rounded-lg border border-white/[0.06] bg-[#0c0c0e] p-2 [-webkit-overflow-scrolling:touch] lg:max-h-[calc(100vh-14rem)]">
          {inputCount === 0 ? (
            <p className="p-3 text-sm text-zinc-500">
              No intake inputs required for the current formulas.
            </p>
          ) : filteredSections.length === 0 ? (
            <p className="p-3 text-sm text-zinc-500">No fields match your search.</p>
          ) : (
            <ClinicalIntakeForm
              sections={filteredSections}
              values={values}
              onValuesChange={setValues}
              defaultOpenSections={defaultOpenSectionCount(inputCount)}
            />
          )}
        </div>
      </div>

      <div className="min-w-0 lg:sticky lg:top-0 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
        <RuntimeResultsPanel
          outcomes={schema.outputs.outcomes}
          runtimeReadyCount={schema.runtimeReadyCount}
          result={result}
          isRunning={runMutation.isPending}
          executeError={runError}
          hasAttemptedRun={hasAttemptedRun}
          canRun={canRun}
          missingCount={missingLabels.length}
          onRun={handleRun}
        />
      </div>
    </div>
  );
}
