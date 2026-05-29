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
  useDerivedFactor,
  useDerivedFactorMutations,
} from "../hooks/use-derived-factors";
import { DerivedFactorForm } from "./derived-factor-form";
import { FormulaPlaygroundSkeleton } from "./formula-playground-skeleton";
import type { DerivedFactorUpdatePayload } from "../utils/derived-factor-workspace-values";
import type { FormulaDto, FormulaVersionDto } from "@/types/formula";

const DETAILS_FORM_ID = "derived-factor-details-form";

type DerivedFactorWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelId: string;
  derivedFactorId: string | null;
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

export function DerivedFactorWorkspaceDialog({
  open,
  onOpenChange,
  modelId,
  derivedFactorId,
  readOnly = false,
  variablePool,
  initialTab = "details",
  onDeleted,
}: DerivedFactorWorkspaceDialogProps) {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { updateMutation, deleteMutation } = useDerivedFactorMutations(modelId);
  const derivedQuery = useDerivedFactor(modelId, open ? derivedFactorId : null);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const [reviewNote, setReviewNote] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [parseDependencies, setParseDependencies] = useState<string[]>([]);
  const [savingDetails, setSavingDetails] = useState(false);

  const derived = derivedQuery.data ?? null;

  useEffect(() => {
    if (!open) {
      setActiveTab(initialTab);
      setReviewNote("");
      setDecisionNote("");
      return;
    }
    setActiveTab(initialTab);
  }, [open, derivedFactorId, initialTab]);

  const formulaQuery = useQuery({
    queryKey: ["formula-by-target", modelId, "derived_factor", derived?.id],
    enabled: Boolean(open && derived?.id),
    queryFn: async () =>
      (await getFormulaByTarget(modelId, "derived_factor", derived!.id)).data,
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
  }, [derived?.id, currentFormula?.id, currentFormula?.framework]);

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
      if (!derived) {
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
          targetType: "derived_factor",
          targetId: derived.id,
          formulaKind: "derived_factor",
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
      if (derived) {
        await queryClient.invalidateQueries({
          queryKey: ["formula-by-target", modelId, "derived_factor", derived.id],
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
    if (!derived || readOnly) {
      return;
    }
    const ok = await confirm({
      title: `Delete derived factor “${derived.displayName}”?`,
      description:
        "This removes the derived factor and any attached formula. This cannot be undone.",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) {
      return;
    }
    await deleteMutation.mutateAsync(derived.id);
    onOpenChange(false);
    onDeleted?.();
  }

  if (!derivedFactorId) {
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
                {readOnly ? "View derived factor" : "Manage derived factor"}
              </DialogTitle>
              <DialogDescription className="text-[#71717a]">
                {derived ? (
                  <>
                    {derived.displayName}{" "}
                    <span className="font-mono text-[#52525b]">({derived.slug})</span>
                  </>
                ) : (
                  "Loading…"
                )}
              </DialogDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {derived ? (
                <>
                  <StatusBadge status={derived.statusCode} />
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
          {derivedQuery.isLoading ? <FactorTableSkeleton /> : null}

          {derivedQuery.error ? (
            <p className="text-sm text-rose-300">Could not load derived factor.</p>
          ) : null}

          {derived && activeTab === "details" ? (
            <div className="space-y-4">
              <p className="text-xs text-[#52525b]">
                Slug <span className="font-mono text-[#71717a]">{derived.slug}</span> is fixed after
                creation.
              </p>

              <DerivedFactorForm
                key={`${derived.id}-${derived.version}`}
                mode="edit"
                initial={derived}
                formId={DETAILS_FORM_ID}
                hideSubmitButton
                readOnly={readOnly}
                layout="workspace"
                onSavingChange={setSavingDetails}
                onSubmit={async (payload) => {
                  const update = payload as DerivedFactorUpdatePayload;
                  await updateMutation.mutateAsync({
                    derivedFactorId: derived.id,
                    payload: {
                      ...update,
                      expectedVersion: derived.version,
                    },
                  });
                  await derivedQuery.refetch();
                }}
              />

              <section className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-[#71717a]">
                <p>
                  Created {new Date(derived.createdAt).toLocaleString()}
                  {derived.createdBy ? ` · ${derived.createdBy}` : ""}
                </p>
                <p className="mt-1">
                  Updated {new Date(derived.updatedAt).toLocaleString()}
                  {derived.updatedBy ? ` · ${derived.updatedBy}` : ""}
                </p>
                <p className="mt-1">Version {derived.version}</p>
              </section>
            </div>
          ) : null}

          {derived && activeTab === "formula" ? (
            <div className="space-y-4">
              {variablePool.length === 0 ? (
                <p className="text-xs text-amber-300">
                  Attach factor sets on this model before authoring derived formulas. Only raw
                  factor slugs can be used as variables.
                </p>
              ) : null}

              {missingDependencies.length > 0 ? (
                <p className="text-xs text-amber-300">
                  Unknown aliases: {missingDependencies.join(", ")}
                </p>
              ) : null}

              <FormulaPlaygroundSkeleton
                key={derived.id}
                layout="stacked"
                targetLabel={derived.displayName}
                targetAlias={derived.slug}
                framework={selectedFramework}
                frameworkOptions={frameworkOptions}
                onFrameworkChange={(next) => setSelectedFramework(next)}
                frameworkLocked={Boolean(currentFormula)}
                initialExpression={currentFormula?.rawExpression ?? `${derived.slug} = `}
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
                  disabled={deleteMutation.isPending || !derived}
                  onClick={() => {
                    void handleDelete().catch(() => undefined);
                  }}
                >
                  {deleteMutation.isPending ? "Deleting…" : "Delete derived factor"}
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
