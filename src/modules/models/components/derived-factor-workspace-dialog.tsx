"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { SimulationDependencySummary } from "@/services/simulation-formula.service";
import {
  useDerivedFactor,
  useDerivedFactorMutations,
  useDerivedFactors,
} from "../hooks/use-derived-factors";
import { buildFormulaVariablePool } from "@/modules/models/utils/formula-variable-pool";
import type { FormulaWorkspaceStepConfig } from "@/modules/models/components/formula-workspace-stepper";
import { DerivedFactorForm } from "./derived-factor-form";
import { FormulaStudio } from "./formula-playground-skeleton";
import { FormulaParametersStep } from "./formula-parameters-step";
import { DerivedFactorMappingStep } from "./derived-factor-mapping-step";
import {
  FormulaWorkspaceStepper,
  type FormulaWorkspaceStep,
} from "./formula-workspace-stepper";
import type { DerivedFactorUpdatePayload } from "../utils/derived-factor-workspace-values";
import { dtoToParameterInput } from "@/modules/models/utils/formula-parameters";
import { normalizeFormulaParametersForMappings } from "@/modules/models/utils/normalize-formula-parameters";
import { resolveFormulaPayload } from "@/modules/models/utils/resolve-formula-payload";
import type { FormulaParameterInput, FormulaVersionDto } from "@/types/formula";
import type { FormulaVariablePoolItem } from "@/modules/models/utils/formula-variable-pool";
import { useModelFactorInstances } from "../hooks/use-model-factor-instances";

const EMPTY_DEPENDENCY_SUMMARY: SimulationDependencySummary = {
  usedDynamic: [],
  usedStatic: [],
  undeclared: [],
  unusedDeclared: [],
};

const DETAILS_FORM_ID = "derived-factor-details-form";

type DerivedFactorWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelId: string;
  derivedFactorId: string | null;
  readOnly?: boolean;
  variablePool: FormulaVariablePoolItem[];
  initialTab?: "details" | "formula";
  /** When set, opens directly on this wizard step (overrides `initialTab`). */
  initialFlowStep?: FormulaWorkspaceStep;
  onDeleted?: () => void;
};

type WorkspaceTab = "details" | "formula";

function toFlowStep(
  tab: WorkspaceTab,
  isTransformation: boolean,
): FormulaWorkspaceStep {
  if (tab === "formula") {
    return isTransformation ? "mapping" : "studio";
  }
  return "basics";
}

export function DerivedFactorWorkspaceDialog({
  open,
  onOpenChange,
  modelId,
  derivedFactorId,
  readOnly = false,
  variablePool,
  initialTab = "details",
  initialFlowStep,
  onDeleted,
}: DerivedFactorWorkspaceDialogProps) {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { updateMutation, deleteMutation } = useDerivedFactorMutations(modelId);
  const factorInstancesQuery = useModelFactorInstances(modelId);
  const derivedFactorsQuery = useDerivedFactors(modelId);
  const derivedQuery = useDerivedFactor(modelId, open ? derivedFactorId : null);

  const [flowStep, setFlowStep] = useState<FormulaWorkspaceStep>("basics");
  const [reviewNote, setReviewNote] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [dependencySummary, setDependencySummary] =
    useState<SimulationDependencySummary>(EMPTY_DEPENDENCY_SUMMARY);
  const [formulaValidateState, setFormulaValidateState] = useState<
    "idle" | "validating" | "valid" | "broken" | "offline"
  >("idle");
  const [formulaParameters, setFormulaParameters] = useState<FormulaParameterInput[]>([]);
  const parametersDirtyRef = useRef(false);
  const [savingDetails, setSavingDetails] = useState(false);

  const derived = derivedQuery.data ?? null;
  const isTransformation =
    derived?.derivedFactorType === "categorical_mapping";

  const workspaceVariablePool = useMemo(
    () =>
      buildFormulaVariablePool({
        factorInstances: factorInstancesQuery.data ?? [],
        derivedFactors: derivedFactorsQuery.data ?? [],
        excludeDerivedFactorId: derivedFactorId,
        preferredMappingDerivedFactorId: derivedFactorId,
      }),
    [derivedFactorId, derivedFactorsQuery.data, factorInstancesQuery.data],
  );

  const activeVariablePool =
    workspaceVariablePool.length > 0 ? workspaceVariablePool : variablePool;

  const wizardSteps = useMemo((): FormulaWorkspaceStepConfig[] => {
    if (isTransformation) {
      return [
        { id: "basics", label: "Basics" },
        { id: "mapping", label: "Transformations" },
        { id: "review", label: "Review" },
      ];
    }
    return [
      { id: "basics", label: "Basics" },
      { id: "parameters", label: "Parameters" },
      { id: "studio", label: "Formula Studio" },
      { id: "review", label: "Review" },
    ];
  }, [isTransformation]);

  useEffect(() => {
    if (!open) {
      setFlowStep("basics");
      setReviewNote("");
      setDecisionNote("");
      return;
    }
    if (initialFlowStep) {
      setFlowStep(initialFlowStep);
      return;
    }
    setFlowStep(toFlowStep(initialTab, isTransformation));
  }, [open, derivedFactorId, initialTab, initialFlowStep, isTransformation]);

  const formulaQuery = useQuery({
    queryKey: ["formula-by-target", modelId, "derived_factor", derived?.id],
    enabled: Boolean(open && derived?.id),
    queryFn: async () => getFormulaByTarget(modelId, "derived_factor", derived!.id),
    retry: false,
  });

  const currentFormula = resolveFormulaPayload(formulaQuery.data);

  const versionQuery = useQuery({
    queryKey: ["formula-versions", currentFormula?.id],
    enabled: Boolean(open && currentFormula?.id),
    queryFn: async () => (await listFormulaVersions(currentFormula!.id)).data,
    retry: false,
  });

  const formulaStatus = currentFormula?.status?.toLowerCase() ?? null;
  const missingDependencies = dependencySummary.undeclared;
  const mappingIsConfigured = Boolean(
    derived?.mappingConfig?.sourceFactorInstanceId &&
      (derived.mappingConfig.mappings?.length ?? 0) > 0,
  );
  const canSubmitForReview =
    !readOnly &&
    !isTransformation &&
    formulaStatus !== "pending_review" &&
    formulaStatus !== "approved" &&
    formulaValidateState === "valid" &&
    missingDependencies.length === 0;
  const submitDisabledReason = isTransformation
    ? "Transformation factors do not use Formula Studio"
    : formulaStatus === "pending_review"
      ? "Already submitted for review"
      : formulaStatus === "approved"
        ? "Formula is already approved"
        : formulaValidateState === "offline"
          ? "Simulation service offline"
          : formulaValidateState !== "valid"
            ? "Enter a valid formula expression before submit"
            : missingDependencies.length > 0
              ? `Undeclared: ${missingDependencies.join(", ")}`
              : undefined;
  const canReviewDecision = currentFormula?.status?.toLowerCase() === "pending_review";

  const initialFormulaParameters = useMemo(() => {
    const next = currentFormula?.formulaParameters
      ? dtoToParameterInput(currentFormula.formulaParameters)
      : [];
    return normalizeFormulaParametersForMappings(next, activeVariablePool);
  }, [currentFormula?.formulaParameters, activeVariablePool]);

  useEffect(() => {
    if (!open) {
      parametersDirtyRef.current = false;
      return;
    }
    if (!parametersDirtyRef.current) {
      setFormulaParameters(initialFormulaParameters);
    }
  }, [open, initialFormulaParameters]);

  const handleFormulaParametersChange = useCallback(
    (next: FormulaParameterInput[]) => {
      parametersDirtyRef.current = true;
      setFormulaParameters(next);
    },
    [],
  );
  const latestVersion = (versionQuery.data?.[0] ?? null) as FormulaVersionDto | null;

  useEffect(() => {
    if (!derived) {
      return;
    }
    if (flowStep === "mapping" && !isTransformation) {
      setFlowStep("parameters");
    } else if (
      (flowStep === "parameters" || flowStep === "studio") &&
      isTransformation
    ) {
      setFlowStep("mapping");
    }
  }, [derived, flowStep, isTransformation]);

  const invalidateDerivedFactorQueries = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["model-derived-factors", modelId],
    });
    if (derived?.id) {
      await queryClient.invalidateQueries({
        queryKey: ["model-derived-factor", modelId, derived.id],
      });
    }
    await derivedFactorsQuery.refetch();
    await derivedQuery.refetch();
  }, [derived?.id, derivedFactorsQuery, derivedQuery, modelId, queryClient]);

  const handleParseUpdate = useCallback(
    ({
      dependencySummary: summary,
      status,
    }: {
      dependencySummary: SimulationDependencySummary;
      status: "idle" | "validating" | "valid" | "broken" | "offline";
    }) => {
      setDependencySummary(summary);
      setFormulaValidateState(status);
    },
    [],
  );

  const saveParametersMutation = useMutation({
    mutationFn: async () => {
      if (!derived) {
        throw new Error("Derived factor not loaded.");
      }
      const normalized = normalizeFormulaParametersForMappings(
        formulaParameters,
        activeVariablePool,
      );
      const existing = await getFormulaByTarget(
        modelId,
        "derived_factor",
        derived.id,
      );

      if (existing) {
        return (
          await updateFormula(existing.id, {
            formulaParameters: normalized,
            expectedVersion: existing.version,
          })
        ).data;
      }

      if (normalized.length === 0) {
        return null;
      }

      return (
        await createFormula(modelId, {
          modelId,
          targetType: "derived_factor",
          targetId: derived.id,
          formulaKind: "derived_factor",
          formulaType: "deterministic",
          rawExpression: "0",
          formulaParameters: normalized,
          manualMode: false,
        })
      ).data;
    },
    onSuccess: async () => {
      parametersDirtyRef.current = false;
      if (derived) {
        await queryClient.invalidateQueries({
          queryKey: ["formula-by-target", modelId, "derived_factor", derived.id],
        });
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save parameters");
    },
  });

  const persistFormulaParameters = useCallback(async () => {
    if (readOnly || isTransformation) {
      return;
    }
    await saveParametersMutation.mutateAsync();
  }, [isTransformation, readOnly, saveParametersMutation]);

  const saveDraftMutation = useMutation({
    mutationFn: async (expression: string) => {
      if (!derived) {
        return null;
      }
      const existing = await getFormulaByTarget(
        modelId,
        "derived_factor",
        derived.id,
      );
      if (existing) {
        return (
          await updateFormula(existing.id, {
            rawExpression: expression,
            formulaParameters: normalizeFormulaParametersForMappings(
              formulaParameters,
              activeVariablePool,
            ),
            expectedVersion: existing.version,
          })
        ).data;
      }

      return (
        await createFormula(modelId, {
          modelId,
          targetType: "derived_factor",
          targetId: derived.id,
          formulaKind: "derived_factor",
          formulaType: "deterministic",
          rawExpression: expression,
          formulaParameters: normalizeFormulaParametersForMappings(
            formulaParameters,
            activeVariablePool,
          ),
          manualMode: false,
        })
      ).data;
    },
    onSuccess: async () => {
      parametersDirtyRef.current = false;
      toast.success("Formula draft saved");
      if (derived) {
        await queryClient.invalidateQueries({
          queryKey: ["formula-by-target", modelId, "derived_factor", derived.id],
        });
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save draft");
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (expression: string) => {
      if (!derived) {
        throw new Error("Derived factor not loaded.");
      }
      const existing = await getFormulaByTarget(
        modelId,
        "derived_factor",
        derived.id,
      );
      const savedFormula = existing
        ? (
            await updateFormula(existing.id, {
              rawExpression: expression,
              formulaParameters: normalizeFormulaParametersForMappings(
                formulaParameters,
                activeVariablePool,
              ),
              expectedVersion: existing.version,
            })
          ).data
        : (
            await createFormula(modelId, {
              modelId,
              targetType: "derived_factor",
              targetId: derived.id,
              formulaKind: "derived_factor",
              formulaType: "deterministic",
              rawExpression: expression,
              formulaParameters: normalizeFormulaParametersForMappings(
                formulaParameters,
                activeVariablePool,
              ),
              manualMode: false,
            })
          ).data;
      await submitFormulaForReview(savedFormula.id, {
        expectedVersion: savedFormula.version,
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
          "fixed top-0 right-0 left-auto flex h-full max-h-none w-[min(1600px,92vw)] max-w-none translate-x-0 translate-y-0 flex-col rounded-none border-l border-white/[0.08] bg-[#0c0c0e] p-0 sm:max-w-none",
          "data-open:slide-in-from-right data-closed:slide-out-to-right",
        )}
      >
        <DialogHeader className="shrink-0 border-b border-white/[0.06] px-5 py-4">
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
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-3">
            <FormulaWorkspaceStepper
              active={flowStep}
              onStepClick={(step) => setFlowStep(step)}
              steps={wizardSteps}
              completedThrough={
                isTransformation
                  ? mappingIsConfigured
                    ? "mapping"
                    : "basics"
                  : formulaParameters.length > 0
                    ? "parameters"
                    : "basics"
              }
            />
          </div>
        </DialogHeader>

        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto px-5 py-4",
            flowStep === "studio" && "overflow-hidden px-0 py-0",
          )}
        >
          {derivedQuery.isLoading ? <FactorTableSkeleton /> : null}

          {derivedQuery.error ? (
            <p className="text-sm text-rose-300">Could not load derived factor.</p>
          ) : null}

          {derived && flowStep === "basics" ? (
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

          {derived && flowStep === "parameters" ? (
            <div className="flex h-full min-h-0 flex-1 flex-col">
              <FormulaParametersStep
                variablePool={activeVariablePool}
                parameters={formulaParameters}
                onChange={handleFormulaParametersChange}
                readOnly={readOnly}
              />
            </div>
          ) : null}

          {derived && flowStep === "mapping" ? (
            <DerivedFactorMappingStep
              derivedFactor={derived}
              factorInstances={factorInstancesQuery.data ?? []}
              readOnly={readOnly}
              transformationOnly={isTransformation}
              onSave={async (payload) => {
                await updateMutation.mutateAsync({
                  derivedFactorId: derived.id,
                  payload: {
                    ...payload,
                    expectedVersion: derived.version,
                  },
                });
                await invalidateDerivedFactorQueries();
                toast.success("Transformation saved");
              }}
            />
          ) : null}

          {derived && flowStep === "studio" && !isTransformation ? (
            <div className="flex h-full min-h-0 flex-1 flex-col">
              {missingDependencies.length > 0 ? (
                <p className="shrink-0 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
                  Undeclared: {missingDependencies.join(", ")} — add in Step 2 or fix expression.
                </p>
              ) : null}
              <div className="min-h-0 flex-1 overflow-hidden">
                <FormulaStudio
                  key={derived.id}
                  targetLabel={derived.displayName}
                  targetAlias={derived.slug}
                  targetUnitCode={derived.unitCode}
                  initialExpression={currentFormula?.rawExpression}
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
                      : async (storedExpression) => {
                          await submitReviewMutation.mutateAsync(storedExpression);
                        }
                  }
                  isSavingDraft={saveDraftMutation.isPending}
                  isSubmittingReview={submitReviewMutation.isPending}
                  canSubmitForReview={canSubmitForReview}
                  submitDisabledReason={submitDisabledReason}
                  onParseUpdate={handleParseUpdate}
                  variablePool={activeVariablePool}
                  formulaParameters={formulaParameters}
                />
              </div>
            </div>
          ) : null}

          {derived && flowStep === "review" ? (
            <div className="mx-auto max-w-2xl space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-[#f4f4f5]">
                  {isTransformation ? "Review transformation" : "Review & publish"}
                </h3>
                <p className="mt-1 text-xs text-[#71717a]">
                  {isTransformation
                    ? "Transformation outputs are numeric features used in derived factors and outcomes. No formula approval is required."
                    : "Submit for review when the formula validates in Studio."}
                </p>
              </div>
              {isTransformation ? (
                <section className="rounded-lg border border-white/10 bg-[#0f0f11] p-4 text-xs text-zinc-400">
                  <p className="font-medium text-zinc-200">Status</p>
                  <p className="mt-1">
                    {mappingIsConfigured ? (
                      <span className="text-emerald-300/90">
                        Ready — formulas can reference{" "}
                        <span className="font-mono text-cyan-200">{derived.slug}</span> as a
                        numeric input.
                      </span>
                    ) : (
                      <span className="text-amber-300/90">
                        Incomplete — save transformation rows in the previous step.
                      </span>
                    )}
                  </p>
                </section>
              ) : null}
              {!isTransformation && currentFormula && latestVersion ? (
                <section className="rounded-lg border border-white/10 bg-[#0f0f11] p-4 text-xs text-zinc-400">
                  <p className="font-medium text-zinc-200">Governance</p>
                  <p className="mt-1">
                    Status <span className="text-zinc-200">{currentFormula.status}</span> ·{" "}
                    Runtime{" "}
                    <span className="text-zinc-200">
                      {currentFormula.runtimeReady ? "ready" : "not ready"}
                    </span>
                  </p>
                  {canReviewDecision && !readOnly ? (
                    <div className="mt-4 space-y-2">
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
              ) : !isTransformation ? (
                <p className="text-xs text-[#71717a]">Save a formula draft in Studio first.</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t border-white/[0.06] px-5 py-4">
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
              {flowStep !== wizardSteps[0]?.id ? (
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/10 text-zinc-300"
                  onClick={() => {
                    const idx = wizardSteps.findIndex((s) => s.id === flowStep);
                    if (idx > 0) {
                      setFlowStep(wizardSteps[idx - 1]!.id);
                    }
                  }}
                >
                  Back
                </Button>
              ) : null}
              {flowStep !== wizardSteps[wizardSteps.length - 1]?.id ? (
                <LoadingButton
                  type="button"
                  className="bg-cyan-600/90 text-white hover:bg-cyan-600"
                  loading={saveParametersMutation.isPending}
                  loadingText="Saving…"
                  onClick={() => {
                    void (async () => {
                      try {
                        if (flowStep === "parameters" && !readOnly && !isTransformation) {
                          await persistFormulaParameters();
                        }
                        const idx = wizardSteps.findIndex((s) => s.id === flowStep);
                        if (idx < wizardSteps.length - 1) {
                          setFlowStep(wizardSteps[idx + 1]!.id);
                        }
                      } catch {
                        // Error toast handled by mutation
                      }
                    })();
                  }}
                >
                  {flowStep === "parameters" && !readOnly && !isTransformation
                    ? "Save & continue"
                    : "Next"}
                </LoadingButton>
              ) : null}
              {flowStep === "basics" && !readOnly ? (
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
