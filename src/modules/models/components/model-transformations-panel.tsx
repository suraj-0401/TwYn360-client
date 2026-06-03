"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Plus, Trash2 } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-table/data-table";
import { PlatformDataTable } from "@/components/data-table/platform-data-table";
import { useConfirm } from "@/components/feedback";
import { FactorTableSkeleton, QueryErrorState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDerivedFactorMutations, useDerivedFactors } from "../hooks/use-derived-factors";
import { useModelFactorInstances } from "../hooks/use-model-factor-instances";
import { buildFormulaVariablePool, slugToFormulaAlias } from "../utils/formula-variable-pool";
import { transformationMappingStatus } from "../utils/derived-factor-segments";
import {
  buildInitialMappingConfigForSource,
  buildTransformationMatrix,
  collectTransformationSlugs,
  formatSourceFactorLabel,
  suggestTransformationSlug,
  type TransformationMatrixRow,
} from "../utils/transformation-matrix";
import { DerivedFactorWorkspaceDialog } from "./derived-factor-workspace-dialog";
import type { DerivedFactorDefinitionDto } from "@/types/formula";
import type { FormulaWorkspaceStep } from "./formula-workspace-stepper";

type ModelTransformationsPanelProps = {
  modelId: string;
  readOnly?: boolean;
  layout?: "default" | "workspace";
};

export function ModelTransformationsPanel({
  modelId,
  readOnly = false,
  layout = "workspace",
}: ModelTransformationsPanelProps) {
  const { confirm } = useConfirm();
  const isWorkspace = layout === "workspace";
  const derivedQuery = useDerivedFactors(modelId);
  const { createMutation, deleteMutation } = useDerivedFactorMutations(modelId);
  const factorInstancesQuery = useModelFactorInstances(modelId);

  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceFactorId, setWorkspaceFactorId] = useState<string | null>(null);
  const [workspaceFlowStep, setWorkspaceFlowStep] = useState<
    FormulaWorkspaceStep | undefined
  >(undefined);
  const [creatingSourceId, setCreatingSourceId] = useState<string | null>(null);

  const allDerived = derivedQuery.data ?? [];
  const factorInstances = factorInstancesQuery.data ?? [];

  const matrixRows = useMemo(
    () => buildTransformationMatrix(factorInstances, allDerived),
    [factorInstances, allDerived],
  );

  const variablePool = useMemo(
    () =>
      buildFormulaVariablePool({
        factorInstances,
        derivedFactors: allDerived,
        excludeDerivedFactorId: workspaceFactorId,
        preferredMappingDerivedFactorId: workspaceFactorId,
      }),
    [factorInstances, allDerived, workspaceFactorId],
  );

  const canEdit = !readOnly;
  const isLoading = derivedQuery.isLoading || factorInstancesQuery.isLoading;

  function openWorkspace(
    factorId: string,
    flowStep: FormulaWorkspaceStep = "mapping",
  ) {
    setWorkspaceFactorId(factorId);
    setWorkspaceFlowStep(flowStep);
    setWorkspaceOpen(true);
  }

  async function handleSetUp(row: TransformationMatrixRow) {
    if (!canEdit || row.transformation) {
      if (row.transformation) {
        openWorkspace(row.transformation.id, "mapping");
      }
      return;
    }

    setCreatingSourceId(row.sourceInstance.id);
    try {
      const taken = collectTransformationSlugs(allDerived);
      const slug = suggestTransformationSlug(row.sourceInstance.factor.slug, taken);
      const created = await createMutation.mutateAsync({
        slug,
        displayName: row.sourceInstance.resolved.displayName,
        derivedFactorType: "categorical_mapping",
        mappingConfig: buildInitialMappingConfigForSource(row.sourceInstance),
        mappingVersion: 1,
      });
      openWorkspace(created.id, "mapping");
    } finally {
      setCreatingSourceId(null);
    }
  }

  async function handleDelete(transformation: DerivedFactorDefinitionDto) {
    if (!canEdit) {
      return;
    }
    const ok = await confirm({
      title: `Delete “${transformation.displayName}”?`,
      description: "Removes this transformation.",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) {
      return;
    }
    await deleteMutation.mutateAsync(transformation.id);
  }

  const columns = useMemo((): DataTableColumn<TransformationMatrixRow>[] => {
    return [
      {
        id: "source",
        header: "Intake factor",
        cell: (row) => (
          <div className="min-w-0">
            <p
              className={cn(
                "truncate font-mono text-sm font-medium",
                isWorkspace ? "text-[#f4f4f5]" : undefined,
              )}
            >
              {formatSourceFactorLabel(row.sourceInstance)}
            </p>
            <p
              className={cn(
                "truncate text-xs",
                isWorkspace ? "text-[#52525b]" : "text-muted-foreground",
              )}
            >
              {row.sourceInstance.resolved.displayName}
            </p>
          </div>
        ),
      },
      {
        id: "type",
        header: "Type",
        className: isWorkspace ? "text-[#71717a]" : "text-muted-foreground",
        cell: (row) => (
          <span className="text-xs uppercase tracking-wide">
            {row.sourceInstance.resolved.dataTypeCode ?? "enum"}
          </span>
        ),
      },
      {
        id: "unit",
        header: "Unit",
        className: isWorkspace ? "text-[#71717a]" : "text-muted-foreground",
        cell: (row) => (
          <span className="text-sm">
            {row.sourceInstance.resolved.unitCode?.trim() || "—"}
          </span>
        ),
      },
      {
        id: "output",
        header: "Numeric output",
        cell: (row) => {
          if (!row.transformation) {
            return <span className="text-xs text-[#52525b]">—</span>;
          }
          return (
            <span className="font-mono text-sm text-cyan-200/90">
              {slugToFormulaAlias(row.transformation.slug)}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => {
          if (!row.transformation) {
            return (
              <span className="text-[10px] font-medium uppercase tracking-wide text-[#52525b]">
                Not set up
              </span>
            );
          }
          const status = transformationMappingStatus(row.transformation);
          return (
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wide",
                status === "ready" ? "text-emerald-400/90" : "text-amber-400/90",
              )}
            >
              {status === "ready" ? "Ready" : "Incomplete"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        className: "w-[1%] whitespace-nowrap text-right",
        cell: (row) => {
          const isCreating =
            creatingSourceId === row.sourceInstance.id && createMutation.isPending;

          if (row.transformation) {
            return (
              <div className="flex items-center justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-[#a1a1aa] hover:bg-white/[0.04] hover:text-cyan-200"
                  onClick={(event) => {
                    event.stopPropagation();
                    openWorkspace(row.transformation!.id, "mapping");
                  }}
                >
                  {readOnly ? (
                    <Eye className="size-3.5" aria-hidden />
                  ) : null}
                  {readOnly ? "View" : "Edit"}
                </Button>
                {!readOnly ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-[#a1a1aa] hover:bg-rose-500/10 hover:text-rose-300"
                    disabled={deleteMutation.isPending}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDelete(row.transformation!).catch(() => undefined);
                    }}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Delete
                  </Button>
                ) : null}
              </div>
            );
          }

          if (!canEdit) {
            return <span className="text-xs text-[#52525b]">—</span>;
          }

          return (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1 border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
              disabled={isCreating}
              onClick={(event) => {
                event.stopPropagation();
                void handleSetUp(row).catch(() => undefined);
              }}
            >
              {isCreating ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Plus className="size-3.5" aria-hidden />
              )}
              Set up
            </Button>
          );
        },
      },
    ];
  }, [
    isWorkspace,
    readOnly,
    canEdit,
    creatingSourceId,
    createMutation.isPending,
    deleteMutation.isPending,
  ]);

  if (isLoading) {
    return <FactorTableSkeleton />;
  }

  const queryError = derivedQuery.error ?? factorInstancesQuery.error;

  return (
    <div className="space-y-4">
      {queryError ? (
        <QueryErrorState
          error={queryError}
          context={{ resource: "transformations" }}
          onRetry={() => {
            void derivedQuery.refetch();
            void factorInstancesQuery.refetch();
          }}
          isRetrying={derivedQuery.isRefetching || factorInstancesQuery.isRefetching}
        />
      ) : null}

      {readOnly ? (
        <p className="text-xs text-amber-400/90">
          <Link
            href={`/models/${modelId}/edit`}
            className="text-cyan-300 underline-offset-2 hover:underline"
          >
            Edit model
          </Link>{" "}
          to set up transformations.
        </p>
      ) : null}

      {matrixRows.length === 0 ? (
        <div
          className={cn(
            "rounded-xl border border-dashed px-6 py-10 text-center text-sm",
            isWorkspace
              ? "border-white/10 text-[#71717a]"
              : "border-border text-muted-foreground",
          )}
        >
          <p>No enum intake factors on this model.</p>
          <p className="mt-2 text-xs">
            Attach factor sets with enum fields under{" "}
            <span className="text-[#a1a1aa]">Raw factors</span>, then return here.
          </p>
        </div>
      ) : isWorkspace ? (
        <PlatformDataTable
          columns={columns}
          items={matrixRows}
          getRowKey={(row) => row.sourceInstance.id}
          onRowClick={(row) => {
            if (row.transformation) {
              openWorkspace(row.transformation.id, "mapping");
            } else if (canEdit) {
              void handleSetUp(row).catch(() => undefined);
            }
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          items={matrixRows}
          getRowKey={(row) => row.sourceInstance.id}
          onRowClick={(row) => {
            if (row.transformation) {
              openWorkspace(row.transformation.id, "mapping");
            } else if (canEdit) {
              void handleSetUp(row).catch(() => undefined);
            }
          }}
        />
      )}

      <DerivedFactorWorkspaceDialog
        open={workspaceOpen}
        onOpenChange={(next) => {
          setWorkspaceOpen(next);
          if (!next) {
            setWorkspaceFlowStep(undefined);
          }
        }}
        modelId={modelId}
        derivedFactorId={workspaceFactorId}
        readOnly={readOnly}
        variablePool={variablePool}
        initialFlowStep={workspaceFlowStep}
        onDeleted={() => setWorkspaceFactorId(null)}
      />
    </div>
  );
}
