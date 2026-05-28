"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FactorTableSkeleton, QueryErrorState } from "@/components/feedback";
import { toast } from "@/lib/toast";
import { useModelFactorInstances } from "../hooks/use-model-factor-instances";
import {
  approveFormula,
  createFormula,
  getFormulaByInstance,
  listFormulaVersions,
  rejectFormula,
  submitFormulaForReview,
  updateFormula,
} from "@/services/formula.service";
import { listSimulationFrameworks } from "@/services/simulation-formula.service";
import { FormulaPlaygroundSkeleton } from "./formula-playground-skeleton";
import type { FormulaDto, FormulaVersionDto } from "@/types/formula";

type ModelFormulaTabProps = {
  modelId: string;
};

export function ModelFormulaTab({ modelId }: ModelFormulaTabProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch, isRefetching } = useModelFactorInstances(modelId);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");
  const [reviewNote, setReviewNote] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("additive");
  const [parseDependencies, setParseDependencies] = useState<string[]>([]);

  const variablePool = useMemo(
    () =>
      (data ?? []).map((item) => ({
        alias: item.factor.slug,
        label: item.resolved.displayName,
        instanceId: item.id,
      })),
    [data],
  );

  const selectedInstance = useMemo(() => {
    const items = data ?? [];
    if (!items.length) {
      return null;
    }
    if (!selectedInstanceId) {
      return items[0];
    }
    return items.find((item) => item.id === selectedInstanceId) ?? items[0];
  }, [data, selectedInstanceId]);

  function resolveFormulaRecord(payload: unknown): FormulaDto | null {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const direct = payload as Partial<FormulaDto>;
    if (typeof direct.id === "string" && typeof direct.rawExpression === "string") {
      return direct as FormulaDto;
    }

    const wrapped = (payload as { data?: Partial<FormulaDto> }).data;
    if (wrapped && typeof wrapped.id === "string" && typeof wrapped.rawExpression === "string") {
      return wrapped as FormulaDto;
    }

    return null;
  }

  const formulaQuery = useQuery({
    queryKey: ["formula-by-instance", modelId, selectedInstance?.id],
    enabled: Boolean(selectedInstance?.id),
    queryFn: async () => {
      return (
        await getFormulaByInstance(modelId, selectedInstance!.id)
      ).data;
    },
    retry: false,
  });
  const frameworksQuery = useQuery({
    queryKey: ["simulation-frameworks"],
    queryFn: async () => listSimulationFrameworks(),
    retry: false,
  });
  const currentFormula = resolveFormulaRecord(formulaQuery.data);
  const frameworkOptions = useMemo(
    () => frameworksQuery.data?.map((item) => item.framework) ?? ["additive"],
    [frameworksQuery.data],
  );
  useEffect(() => {
    if (currentFormula?.framework) {
      setSelectedFramework(currentFormula.framework);
      return;
    }
    if (frameworkOptions.length > 0) {
      setSelectedFramework((previous) =>
        frameworkOptions.includes(previous) ? previous : frameworkOptions[0],
      );
    }
  }, [currentFormula?.framework, frameworkOptions]);
  const versionQuery = useQuery({
    queryKey: ["formula-versions", currentFormula?.id],
    enabled: Boolean(currentFormula?.id),
    queryFn: async () => (await listFormulaVersions(currentFormula!.id)).data,
    retry: false,
  });
  const canSubmitForReview =
    Boolean(currentFormula) &&
    currentFormula?.status?.toLowerCase() !== "broken" &&
    currentFormula?.status?.toLowerCase() !== "archived";
  const canReviewDecision = currentFormula?.status?.toLowerCase() === "pending_review";
  const variableAliases = new Set(variablePool.map((item) => item.alias));
  const missingDependencies = parseDependencies.filter((alias) => !variableAliases.has(alias));
  const handleParseUpdate = useCallback(
    ({ dependencies }: { dependencies: string[] }) => {
      setParseDependencies((previous) => {
        if (
          previous.length === dependencies.length &&
          previous.every((value, index) => value === dependencies[index])
        ) {
          return previous;
        }
        return dependencies;
      });
    },
    [],
  );
  const latestVersion = (versionQuery.data?.[0] ?? null) as FormulaVersionDto | null;

  const saveDraftMutation = useMutation({
    mutationFn: async (expression: string) => {
      if (!selectedInstance) {
        return null;
      }
      const existing = currentFormula;
      const aliasMap = Object.fromEntries(variablePool.map((item) => [item.alias, item.instanceId]));
      if (existing) {
        return (
          await updateFormula(existing.id, {
            rawExpression: expression,
            aliasMap,
            expectedVersion: existing.version,
          })
        ).data;
      }

      return (
        await createFormula(modelId, {
          targetInstanceId: selectedInstance.id,
          modelId,
          formulaType: "deterministic",
          framework: selectedFramework,
          rawExpression: expression,
          aliasMap,
          manualMode: false,
        })
      ).data;
    },
    onSuccess: async () => {
      toast.success("Formula draft saved");
      if (selectedInstance?.id) {
        await queryClient.invalidateQueries({
          queryKey: ["formula-by-instance", modelId, selectedInstance.id],
        });
        await queryClient.invalidateQueries({ queryKey: ["formula-versions"] });
      }
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const formula = currentFormula;
      if (!formula) {
        throw new Error("Save a formula draft before submitting for review.");
      }
      if (!canSubmitForReview) {
        throw new Error(
          `Formula cannot be submitted from status "${formula.status}". Fix validation errors and save draft first.`,
        );
      }
      await submitFormulaForReview(formula.id, {
        expectedVersion: formula.version,
        changeNote: reviewNote.trim() || undefined,
      });
    },
    onSuccess: async () => {
      toast.success("Formula submitted for review");
      setReviewNote("");
      if (selectedInstance?.id) {
        await queryClient.invalidateQueries({
          queryKey: ["formula-by-instance", modelId, selectedInstance.id],
        });
        await queryClient.invalidateQueries({ queryKey: ["formula-versions"] });
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to submit for review");
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!currentFormula) {
        throw new Error("No formula selected.");
      }
      if (!canReviewDecision) {
        throw new Error("Formula is not in pending review state.");
      }
      await approveFormula(currentFormula.id, {
        comment: decisionNote.trim() || undefined,
      });
    },
    onSuccess: async () => {
      toast.success("Formula approved");
      setDecisionNote("");
      await queryClient.invalidateQueries({ queryKey: ["formula-by-instance"] });
      await queryClient.invalidateQueries({ queryKey: ["formula-versions"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to approve formula");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!currentFormula) {
        throw new Error("No formula selected.");
      }
      if (!canReviewDecision) {
        throw new Error("Formula is not in pending review state.");
      }
      if (!decisionNote.trim()) {
        throw new Error("Reject comment is required.");
      }
      await rejectFormula(currentFormula.id, {
        comment: decisionNote.trim(),
      });
    },
    onSuccess: async () => {
      toast.success("Formula rejected");
      setDecisionNote("");
      await queryClient.invalidateQueries({ queryKey: ["formula-by-instance"] });
      await queryClient.invalidateQueries({ queryKey: ["formula-versions"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to reject formula");
    },
  });

  if (error) {
    return (
      <div className="p-4">
        <QueryErrorState
          error={error}
          context={{ resource: "model factor instances" }}
          onRetry={() => {
            void refetch();
          }}
          isRetrying={isRefetching}
        />
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="p-4">
        <FactorTableSkeleton />
      </div>
    );
  }

  if (!selectedInstance) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-6 text-sm text-zinc-400">
        Add model factors to use Formula Playground.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-[#0f0f11] p-3">
        <label htmlFor="formula-target" className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">
          Target factor
        </label>
        <select
          id="formula-target"
          className="w-full rounded-md border border-white/10 bg-[#121216] px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/60 transition focus:ring-2"
          value={selectedInstance.id}
          onChange={(event) => setSelectedInstanceId(event.target.value)}
        >
          {(data ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.resolved.displayName} ({item.factor.slug})
            </option>
          ))}
        </select>
        <label
          htmlFor="formula-review-note"
          className="mb-1 mt-3 block text-xs uppercase tracking-wide text-zinc-400"
        >
          Review note (optional)
        </label>
        <textarea
          id="formula-review-note"
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          className="min-h-[72px] w-full resize-y rounded-md border border-white/10 bg-[#121216] px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/60 transition placeholder:text-zinc-500 focus:ring-2"
          placeholder="Describe what changed and why for reviewers..."
        />
        {missingDependencies.length ? (
          <p className="mt-2 text-xs text-amber-300">
            Unknown aliases in expression: {missingDependencies.join(", ")}. Add corresponding factors or update aliases.
          </p>
        ) : null}
      </div>

      <FormulaPlaygroundSkeleton
        targetLabel={selectedInstance.factor.displayName}
        targetAlias={selectedInstance.factor.slug}
        framework={selectedFramework}
        frameworkOptions={frameworkOptions}
        onFrameworkChange={(next) => setSelectedFramework(next)}
        frameworkLocked={Boolean(currentFormula)}
        initialExpression={currentFormula?.rawExpression}
        governanceStatus={currentFormula?.status ?? null}
        governanceVersion={currentFormula?.version ?? null}
        governanceUpdatedAt={currentFormula?.updatedAt ?? null}
        governanceReason={currentFormula?.validationStatusReason ?? null}
        onSaveDraft={async (expression) => {
          await saveDraftMutation.mutateAsync(expression);
        }}
        onSubmitForReview={async () => {
          await submitReviewMutation.mutateAsync();
        }}
        isSavingDraft={saveDraftMutation.isPending}
        isSubmittingReview={submitReviewMutation.isPending}
        canSubmitForReview={canSubmitForReview}
        onParseUpdate={handleParseUpdate}
        variablePool={variablePool}
      />

      {currentFormula ? (
        <section className="rounded-xl border border-white/10 bg-[#0f0f11] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-100">Governance Timeline</h3>
            <span className="text-xs text-zinc-400">
              {versionQuery.isLoading ? "Loading versions..." : `${versionQuery.data?.length ?? 0} versions`}
            </span>
          </div>

          {versionQuery.isError ? (
            <p className="text-xs text-rose-300">
              Could not load version history for this formula.
            </p>
          ) : null}

          {!versionQuery.isLoading && !versionQuery.isError && (versionQuery.data?.length ?? 0) === 0 ? (
            <p className="text-xs text-zinc-400">No submitted versions yet. Save draft and submit for review.</p>
          ) : null}

          {latestVersion ? (
            <div className="space-y-2">
              {(versionQuery.data ?? []).map((version) => {
                const decision = version.reviewDecision?.decision ?? "PENDING_REVIEW";
                const decisionTone =
                  decision.toLowerCase() === "approved"
                    ? "text-emerald-300"
                    : decision.toLowerCase() === "rejected"
                      ? "text-rose-300"
                      : "text-amber-300";
                return (
                  <div
                    key={version.id}
                    className="rounded-lg border border-white/10 bg-[#131318] p-3 text-xs text-zinc-300"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-zinc-100">Version snapshot</p>
                      <span className={decisionTone}>{decision}</span>
                    </div>
                    <p className="mt-1 text-zinc-400">
                      Created {new Date(version.createdAt).toLocaleString()}
                      {version.createdBy ? ` by ${version.createdBy}` : ""}
                    </p>
                    {version.changeNote ? (
                      <p className="mt-2 rounded border border-white/10 bg-white/[0.02] p-2 text-zinc-300">
                        {version.changeNote}
                      </p>
                    ) : null}
                    {version.reviewDecision?.comment ? (
                      <p className="mt-2 text-zinc-400">{version.reviewDecision.comment}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {canReviewDecision ? (
            <div className="mt-3 rounded-lg border border-white/10 bg-[#131318] p-3">
              <label
                htmlFor="formula-review-decision-note"
                className="mb-1 block text-xs uppercase tracking-wide text-zinc-400"
              >
                Reviewer comment
              </label>
              <textarea
                id="formula-review-decision-note"
                value={decisionNote}
                onChange={(event) => setDecisionNote(event.target.value)}
                className="min-h-[70px] w-full rounded-md border border-white/10 bg-[#121216] px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/60 transition placeholder:text-zinc-500 focus:ring-2"
                placeholder="Add decision context (required for reject)..."
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 disabled:opacity-60"
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  onClick={() => {
                    void approveMutation.mutateAsync().catch(() => undefined);
                  }}
                >
                  {approveMutation.isPending ? "Approving..." : "Approve"}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 disabled:opacity-60"
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  onClick={() => {
                    void rejectMutation.mutateAsync().catch(() => undefined);
                  }}
                >
                  {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
