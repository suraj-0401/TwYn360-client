"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Calculator,
  Eye,
  ListTree,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-table/data-table";
import { PlatformDataTable } from "@/components/data-table/platform-data-table";
import { useConfirm } from "@/components/feedback";
import { FactorTableSkeleton, QueryErrorState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { env } from "@/config/env";
import { useDerivedFactorMutations, useDerivedFactors } from "../hooks/use-derived-factors";
import { useModelFactorInstances } from "../hooks/use-model-factor-instances";
import { useModelFormulas } from "../hooks/use-model-formulas";
import { lookupFormulaByTarget } from "../utils/formula-target-index";
import {
  buildFormulaVariablePool,
  slugToFormulaAlias,
} from "../utils/formula-variable-pool";
import { isFormulaDerivedFactor } from "../utils/derived-factor-segments";
import { toDisplayFormulaExpression } from "../utils/formula-expression";
import { resolveFormulaPayload } from "../utils/resolve-formula-payload";
import {
  CreateDerivedFactorDialog,
  type DerivedFactorCreateKind,
} from "./create-derived-factor-dialog";
import { DerivedFactorWorkspaceDialog } from "./derived-factor-workspace-dialog";
import { FormulaGovernanceBadge } from "./formula-governance-badge";
import type { DerivedFactorDefinitionDto } from "@/types/formula";
import type { FormulaWorkspaceStep } from "./formula-workspace-stepper";

type ModelFormulaFactorsPanelProps = {
  modelId: string;
  readOnly?: boolean;
  layout?: "default" | "workspace";
};

export function ModelFormulaFactorsPanel({
  modelId,
  readOnly = false,
  layout = "workspace",
}: ModelFormulaFactorsPanelProps) {
  const { confirm } = useConfirm();
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;
  const isWorkspace = layout === "workspace";
  const derivedQuery = useDerivedFactors(modelId);
  const { createMutation, deleteMutation } = useDerivedFactorMutations(modelId);
  const { data: factorInstances } = useModelFactorInstances(modelId);

  const [createOpen, setCreateOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceFactorId, setWorkspaceFactorId] = useState<string | null>(null);
  const [workspaceFlowStep, setWorkspaceFlowStep] = useState<
    FormulaWorkspaceStep | undefined
  >(undefined);

  const allItems = derivedQuery.data ?? [];
  const items = useMemo(() => allItems.filter(isFormulaDerivedFactor), [allItems]);

  const variablePool = useMemo(
    () =>
      buildFormulaVariablePool({
        factorInstances: factorInstances ?? [],
        derivedFactors: allItems,
        excludeDerivedFactorId: workspaceFactorId,
        preferredMappingDerivedFactorId: workspaceFactorId,
      }),
    [factorInstances, allItems, workspaceFactorId],
  );

  const modelFormulasQuery = useModelFormulas(modelId);

  const formulaPayloadById = useMemo(() => {
    const map = new Map<string, unknown>();
    for (const item of items) {
      map.set(
        item.id,
        lookupFormulaByTarget(modelFormulasQuery.byTarget, "derived_factor", item.id) ??
          null,
      );
    }
    return map;
  }, [items, modelFormulasQuery.byTarget]);

  const canEdit = !readOnly;

  function openWorkspace(
    factorId: string,
    flowStep: FormulaWorkspaceStep = "studio",
  ) {
    setWorkspaceFactorId(factorId);
    setWorkspaceFlowStep(flowStep);
    setWorkspaceOpen(true);
  }

  async function handleDeleteRow(row: DerivedFactorDefinitionDto) {
    if (!canEdit) {
      return;
    }
    const ok = await confirm({
      title: `Delete “${row.displayName}”?`,
      description:
        "Removes this derived factor and its expression. This cannot be undone.",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) {
      return;
    }
    await deleteMutation.mutateAsync(row.id);
  }

  const columns = useMemo((): DataTableColumn<DerivedFactorDefinitionDto>[] => {
    return [
      {
        id: "factor",
        header: "Derived factor",
        cell: (row) => (
          <div className="min-w-0">
            <div
              className={cn(
                "truncate font-medium",
                isWorkspace ? "text-[#f4f4f5]" : undefined,
              )}
            >
              {row.displayName}
            </div>
            <p
              className={cn(
                "truncate font-mono text-xs",
                isWorkspace ? "text-[#52525b]" : "text-muted-foreground",
              )}
            >
              {row.slug}
            </p>
          </div>
        ),
      },
      {
        id: "expression",
        header: "Expression",
        cell: (row) => {
          const formula = resolveFormulaPayload(formulaPayloadById.get(row.id));
          const targetAlias = slugToFormulaAlias(row.slug);
          if (!formula?.rawExpression?.trim()) {
            return (
              <span className="text-xs text-zinc-500">No expression yet</span>
            );
          }
          const display = toDisplayFormulaExpression(
            formula.rawExpression,
            targetAlias,
          );
          return (
            <code
              className={cn(
                "block max-w-[280px] truncate font-mono text-xs",
                isWorkspace ? "text-[#a1a1aa]" : "text-muted-foreground",
              )}
              title={display}
            >
              {targetAlias} = {display}
            </code>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <FormulaGovernanceBadge payload={formulaPayloadById.get(row.id)} />
        ),
      },
      {
        id: "actions",
        header: "",
        className: "w-[1%] whitespace-nowrap text-right",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-1",
                isWorkspace
                  ? "text-[#a1a1aa] hover:bg-white/[0.04] hover:text-cyan-200"
                  : undefined,
              )}
              onClick={(event) => {
                event.stopPropagation();
                openWorkspace(row.id, "studio");
              }}
            >
              <Calculator className="size-3.5" aria-hidden />
              {readOnly ? "View studio" : "Formula studio"}
            </Button>
            {!readOnly ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-[#a1a1aa] hover:bg-white/[0.04] hover:text-[#f4f4f5]"
                  onClick={(event) => {
                    event.stopPropagation();
                    openWorkspace(row.id, "parameters");
                  }}
                >
                  <ListTree className="size-3.5" aria-hidden />
                  Manage params
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-[#a1a1aa] hover:bg-white/[0.04] hover:text-emerald-200"
                  onClick={(event) => {
                    event.stopPropagation();
                    openWorkspace(row.id, "studio");
                  }}
                >
                  <ShieldCheck className="size-3.5" aria-hidden />
                  Validate
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-[#a1a1aa] hover:bg-rose-500/10 hover:text-rose-300"
                  disabled={deleteMutation.isPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDeleteRow(row).catch(() => undefined);
                  }}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1"
                onClick={(event) => {
                  event.stopPropagation();
                  openWorkspace(row.id, "basics");
                }}
              >
                <Eye className="size-3.5" aria-hidden />
                View
              </Button>
            )}
          </div>
        ),
      },
    ];
  }, [isWorkspace, readOnly, formulaPayloadById, deleteMutation.isPending, canEdit]);

  const createButton = canEdit ? (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={cn(
        "shrink-0 gap-1",
        isWorkspace &&
          "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:text-cyan-100",
      )}
      onClick={() => setCreateOpen(true)}
    >
      <Plus className="size-3.5" aria-hidden />
      Create derived factor
    </Button>
  ) : null;

  const emptyMessage = (
    <div
      className={cn(
        "rounded-xl border border-dashed px-6 py-10 text-center",
        isWorkspace
          ? "border-white/10 bg-[#0f0f11] text-[#71717a]"
          : "border-border bg-muted/20 text-muted-foreground",
      )}
    >
      <p className="text-sm font-medium text-[#a1a1aa]">No derived factors</p>
      <p className="mt-2 text-sm">
        No derived factors created yet. Define numeric expressions that use raw factors and
        transformation outputs.
      </p>
      {canEdit ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            "mt-4 gap-1",
            isWorkspace &&
              "border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20",
          )}
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-3.5" aria-hidden />
          Create derived factor
        </Button>
      ) : (
        <p className="mt-4 text-xs text-amber-400/90">
          <Link
            href={`/models/${modelId}/edit`}
            className="text-cyan-300 underline-offset-2 hover:underline"
          >
            Edit the model
          </Link>{" "}
          to add derived factors.
        </p>
      )}
    </div>
  );

  if (derivedQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">{createButton}</div>
        <FactorTableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {derivedQuery.error ? (
        <QueryErrorState
          error={derivedQuery.error}
          context={{ resource: "derived factors" }}
          onRetry={() => derivedQuery.refetch()}
          isRetrying={derivedQuery.isRefetching}
        />
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3
            className={cn(
              "text-base font-semibold tracking-tight",
              isWorkspace ? "text-[#f4f4f5]" : undefined,
            )}
          >
            Derived factors
          </h3>
          <p
            className={cn(
              "mt-1 text-sm",
              isWorkspace ? "text-[#71717a]" : "text-muted-foreground",
            )}
          >
            Numeric computations built from parameters and expressions ({items.length}{" "}
            configured).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {adminKey ? (
            <Link
              href="/models/derived-factors/form"
              className="text-xs text-cyan-300 underline-offset-2 hover:underline"
            >
              Edit form layout
            </Link>
          ) : null}
          {createButton}
        </div>
      </div>

      {items.length === 0 ? (
        emptyMessage
      ) : isWorkspace ? (
        <PlatformDataTable
          columns={columns}
          items={items}
          getRowKey={(row) => row.id}
          onRowClick={(row) => openWorkspace(row.id, "studio")}
        />
      ) : (
        <DataTable
          columns={columns}
          items={items}
          getRowKey={(row) => row.id}
          onRowClick={(row) => openWorkspace(row.id, "studio")}
        />
      )}

      <CreateDerivedFactorDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultKind={"formula" satisfies DerivedFactorCreateKind}
        isSubmitting={createMutation.isPending}
        onSubmit={async (payload) => {
          const created = await createMutation.mutateAsync(payload);
          setCreateOpen(false);
          openWorkspace(created.id, "parameters");
        }}
      />

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
