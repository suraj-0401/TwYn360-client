"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useConfirm } from "@/components/feedback";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import { FactorTableSkeleton } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/data-table/status-badge";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
  approveFormula,
  createFormula,
  getFormulaByTarget,
  listFormulaVersions,
  rejectFormula,
  submitFormulaForReview,
  updateFormula,
} from "@/services/formula.service";
import { listSimulationFrameworks } from "@/services/simulation-formula.service";
import {
  useOutcome,
  useOutcomeMutations,
} from "../hooks/use-outcomes";
import { OutcomeForm } from "./outcome-form";
import { FormulaPlaygroundSkeleton } from "./formula-playground-skeleton";
import type { OutcomeUpdatePayload } from "../utils/outcome-workspace-values";
import type { FormulaDto, FormulaVersionDto } from "@/types/formula";

const DETAILS_FORM_ID = "outcome-details-form";

type OutcomeWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelId: string;
  outcomeId: string | null;
  readOnly?: boolean;
  variablePool: Array<{ alias: string; label: string; instanceId: string }>;
  initialTab?: "details" | "formula";
  onDeleted?: () => void;
};

type WorkspaceTab = "details" | "formula";

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

export function OutcomeWorkspaceDialog({
  open,
  onOpenChange,
  modelId,
  outcomeId,
  readOnly = false,
  variablePool,
  initialTab = "details",
  onDeleted,
}: OutcomeWorkspaceDialogProps) {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { updateMutation, deleteMutation } = useOutcomeMutations(modelId);
  const outcomeQuery = useOutcome(modelId, open ? outcomeId : null);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const [reviewNote, setReviewNote] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [parseDependencies, setParseDependencies] = useState<string[]>([]);
  const [savingDetails, setSavingDetails] = useState(false);

  const outcome = outcomeQuery.data ?? null;

  useEffect(() => {
    if (!open) {
      setActiveTab(initialTab);
      setReviewNote("");
      setDecisionNote("");
      return;
    }
    setActiveTab(initialTab);
  }, [open, outcomeId, initialTab]);

  const formulaQuery = useQuery({
    queryKey: ["formula-by-target", modelId, "outcome", outcome?.id],
    enabled: Boolean(open && outcome?.id),
    queryFn: async () =>
      (await getFormulaByTarget(modelId, "outcome", outcome!.id)).data,
    retry: false,
  });

  const frameworksQuery = useQuery({
    queryKey: ["simulation-frameworks"],
    queryFn: async () => listSimulationFrameworks(),
    retry: false,
    enabled: open,
  });

  const currentFormula = resolveFormulaRecord(formulaQuery.data);
  const frameworkOptions = useMemo(
    () => frameworksQuery.data?.map((item) => item.framework) ?? [],
    [frameworksQuery.data],
  );

  useEffect(() => {
    setSelectedFramework(currentFormula?.framework ?? null);
  }, [outcome?.id, currentFormula?.id, currentFormula?.framework]);

  const versionQuery = useQuery({
    queryKey: ["formula-versions", currentFormula?.id],
    enabled: Boolean(open && currentFormula?.id),
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
  const latestVersion = (versionQuery.data?.[0] ?? null) as FormulaVersionDto | null;

  const handleParseUpdate = useCallback(
    ({ dependencies }: { dependencies: string[] }) => {
      setParseDependencies(dependencies);
    },
    [],
  );

  const saveDraftMutation = useMutation({
    mutationFn: async (expression: string) => {
      if (!outcome) {
        return null;
      }
      const existing = currentFormula;
      const aliasMap = Object.fromEntries(variablePool.map((item) => [item.alias, item.instanceId]));

      if (existing) {
        return (
          await updateFormula(existing.id, {
            rawExpression: expression,
            aliasMap,
            framework: selectedFramework,
            expectedVersion: existing.version,
          })
        ).data;
      }

      const frameworkFields = selectedFramework ? { framework: selectedFramework } : {};

      return (
        await createFormula(modelId, {
          modelId,
          targetType: "outcome",
          targetId: outcome.id,
          formulaKind: "outcome_model",
          formulaType: "deterministic",
          ...frameworkFields,
          rawExpression: expression,
          aliasMap,
          manualMode: false,
        })
      ).data;
    },
    onSuccess: async () => {
      toast.success("Formula draft saved");
      if (outcome) {
        await queryClient.invalidateQueries({
          queryKey: ["formula-by-target", modelId, "outcome", outcome.id],
        });
      }
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!currentFormula) {
        throw new Error("Save a formula draft before submitting for review.");
      }
      await submitFormulaForReview(currentFormula.id, {
        expectedVersion: currentFormula.version,
        changeNote: reviewNote.trim() || undefined,
      });
    },
    onSuccess: async () => {
      toast.success("Formula submitted for review");
      setReviewNote("");
      await queryClient.invalidateQueries({ queryKey: ["formula-by-target"] });
      await queryClient.invalidateQueries({ queryKey: ["formula-versions"] });
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
      await approveFormula(currentFormula.id, {
        comment: decisionNote.trim() || undefined,
      });
    },
    onSuccess: async () => {
      toast.success("Formula approved");
      setDecisionNote("");
      await queryClient.invalidateQueries({ queryKey: ["formula-by-target"] });
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
      if (!decisionNote.trim()) {
        throw new Error("Reject comment is required.");
      }
      await rejectFormula(currentFormula.id, { comment: decisionNote.trim() });
    },
    onSuccess: async () => {
      toast.success("Formula rejected");
      setDecisionNote("");
      await queryClient.invalidateQueries({ queryKey: ["formula-by-target"] });
      await queryClient.invalidateQueries({ queryKey: ["formula-versions"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to reject formula");
    },
  });

  async function handleDelete() {
    if (!outcome || readOnly) {
      return;
    }
    const ok = await confirm({
      title: `Delete outcome “${outcome.displayName}”?`,
      description:
        "This removes the outcome and any attached formula. This cannot be undone.",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) {
      return;
    }
    await deleteMutation.mutateAsync(outcome.id);
    onOpenChange(false);
    onDeleted?.();
  }

  if (!outcomeId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "fixed top-0 right-0 left-auto flex h-full max-h-none w-full max-w-4xl translate-x-0 translate-y-0 flex-col rounded-none border-l border-white/[0.08] bg-[#0c0c0e] p-0",
          "data-open:slide-in-from-right data-closed:slide-out-to-right",
        )}
      >
        <DialogHeader className="border-b border-white/[0.06] px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-[#f4f4f5]">
                {readOnly ? "View outcome" : "Manage outcome"}
              </DialogTitle>
              <DialogDescription className="text-[#71717a]">
                {outcome ? (
                  <>
                    {outcome.displayName}{" "}
                    <span className="font-mono text-[#52525b]">({outcome.slug})</span>
                  </>
                ) : (
                  "Loading…"
                )}
              </DialogDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {outcome ? (
                <>
                  <StatusBadge status={outcome.statusCode} />
                  {currentFormula ? (
                    <StatusBadge status={currentFormula.status} />
                  ) : (
                    <span className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
                      No formula
                    </span>
                  )}
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex gap-0.5 border-b border-white/[0.06]">
            {(
              [
                { id: "details" as const, label: "Details" },
                { id: "formula" as const, label: "Formula" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 py-2 text-sm transition-colors",
                  activeTab === tab.id
                    ? "text-[#f4f4f5] after:block after:h-0.5 after:bg-cyan-400/80"
                    : "text-[#71717a] hover:text-[#a1a1aa]",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {outcomeQuery.isLoading ? <FactorTableSkeleton /> : null}

          {outcomeQuery.error ? (
            <p className="text-sm text-rose-300">Could not load outcome.</p>
          ) : null}

          {outcome && activeTab === "details" ? (
            <div className="space-y-4">
              <p className="text-xs text-[#52525b]">
                Slug <span className="font-mono text-[#71717a]">{outcome.slug}</span> is fixed after
                creation.
              </p>

              <OutcomeForm
                key={`${outcome.id}-${outcome.version}`}
                mode="edit"
                initial={outcome}
                formId={DETAILS_FORM_ID}
                hideSubmitButton
                readOnly={readOnly}
                layout="workspace"
                onSavingChange={setSavingDetails}
                onSubmit={async (payload) => {
                  const update = payload as OutcomeUpdatePayload;
                  await updateMutation.mutateAsync({
                    outcomeId: outcome.id,
                    payload: {
                      ...update,
                      expectedVersion: outcome.version,
                    },
                  });
                  await outcomeQuery.refetch();
                }}
              />

              <section className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-[#71717a]">
                <p>
                  Created {new Date(outcome.createdAt).toLocaleString()}
                  {outcome.createdBy ? ` · ${outcome.createdBy}` : ""}
                </p>
                <p className="mt-1">
                  Updated {new Date(outcome.updatedAt).toLocaleString()}
                  {outcome.updatedBy ? ` · ${outcome.updatedBy}` : ""}
                </p>
                <p className="mt-1">Version {outcome.version}</p>
              </section>
            </div>
          ) : null}

          {outcome && activeTab === "formula" ? (
            <div className="space-y-4">
              {variablePool.length === 0 ? (
                <p className="text-xs text-amber-300">
                  Attach factor sets on this model before authoring outcome formulas. Only raw
                  factor slugs can be used as variables.
                </p>
              ) : null}

              {missingDependencies.length > 0 ? (
                <p className="text-xs text-amber-300">
                  Unknown aliases: {missingDependencies.join(", ")}
                </p>
              ) : null}

              {!readOnly ? (
                <div>
                  <label
                    htmlFor="outcome-formula-review-note"
                    className="mb-1 block text-xs uppercase tracking-wide text-zinc-400"
                  >
                    Review note (optional)
                  </label>
                  <Textarea
                    id="outcome-formula-review-note"
                    value={reviewNote}
                    onChange={(event) => setReviewNote(event.target.value)}
                    placeholder="Describe what changed and why for reviewers..."
                    className="min-h-[72px] border-white/10 bg-[#121216] text-zinc-100"
                  />
                </div>
              ) : null}

              <FormulaPlaygroundSkeleton
                key={outcome.id}
                layout="stacked"
                targetLabel={outcome.displayName}
                targetAlias={outcome.slug}
                framework={selectedFramework}
                frameworkOptions={frameworkOptions}
                onFrameworkChange={(next) => setSelectedFramework(next)}
                frameworkLocked={Boolean(currentFormula)}
                initialExpression={currentFormula?.rawExpression ?? `${outcome.slug} = `}
                governanceStatus={currentFormula?.status ?? null}
                governanceVersion={currentFormula?.version ?? null}
                governanceUpdatedAt={currentFormula?.updatedAt ?? null}
                governanceReason={currentFormula?.validationStatusReason ?? null}
                onSaveDraft={
                  readOnly
                    ? undefined
                    : async (expression) => {
                        await saveDraftMutation.mutateAsync(expression);
                      }
                }
                onSubmitForReview={
                  readOnly
                    ? undefined
                    : async () => {
                        await submitReviewMutation.mutateAsync();
                      }
                }
                isSavingDraft={saveDraftMutation.isPending}
                isSubmittingReview={submitReviewMutation.isPending}
                canSubmitForReview={canSubmitForReview}
                onParseUpdate={handleParseUpdate}
                variablePool={variablePool}
              />

              {currentFormula && latestVersion ? (
                <section className="rounded-lg border border-white/10 bg-[#0f0f11] p-3 text-xs text-zinc-400">
                  <p className="font-medium text-zinc-200">Latest review</p>
                  <p className="mt-1">
                    {versionQuery.data?.length ?? 0} version(s) ·{" "}
                    {versionQuery.data?.[0]?.reviewDecision?.decision ?? "pending"}
                  </p>
                  {canReviewDecision && !readOnly ? (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={decisionNote}
                        onChange={(event) => setDecisionNote(event.target.value)}
                        placeholder="Reviewer comment (required to reject)"
                        className="min-h-[60px] border-white/10 bg-[#121216] text-zinc-100"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-emerald-500/40 text-emerald-200"
                          disabled={approveMutation.isPending}
                          onClick={() => {
                            void approveMutation.mutateAsync().catch(() => undefined);
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-rose-500/40 text-rose-200"
                          disabled={rejectMutation.isPending}
                          onClick={() => {
                            void rejectMutation.mutateAsync().catch(() => undefined);
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t border-white/[0.06] px-5 py-4">
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div>
              {!readOnly ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-rose-500/40 text-rose-200 hover:bg-rose-500/10"
                  disabled={deleteMutation.isPending || !outcome}
                  onClick={() => {
                    void handleDelete().catch(() => undefined);
                  }}
                >
                  {deleteMutation.isPending ? "Deleting…" : "Delete outcome"}
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              {activeTab === "details" && !readOnly ? (
                <LoadingButton
                  type="submit"
                  form={DETAILS_FORM_ID}
                  loading={savingDetails}
                >
                  Save details
                </LoadingButton>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-transparent text-zinc-200"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
