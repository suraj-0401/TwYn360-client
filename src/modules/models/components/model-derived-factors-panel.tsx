"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-table/data-table";
import { PlatformDataTable } from "@/components/data-table/platform-data-table";
import { StatusBadge } from "@/components/data-table/status-badge";
import { useConfirm } from "@/components/feedback";
import { FactorTableSkeleton, QueryErrorState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { env } from "@/config/env";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { getFormulaByTarget } from "@/services/formula.service";
import { useDerivedFactorMutations, useDerivedFactors } from "../hooks/use-derived-factors";
import { useModelFactorInstances } from "../hooks/use-model-factor-instances";
import { FormulaGovernanceBadge } from "./formula-governance-badge";
import { buildFormulaVariablePool } from "../utils/formula-variable-pool";
import { CreateDerivedFactorDialog } from "./create-derived-factor-dialog";
import { DerivedFactorWorkspaceDialog } from "./derived-factor-workspace-dialog";
import type { DerivedFactorDefinitionDto } from "@/types/formula";

type ModelDerivedFactorsPanelProps = {
  modelId: string;
  readOnly?: boolean;
  layout?: "default" | "workspace";
};

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return String(value);
}

export function ModelDerivedFactorsPanel({
  modelId,
  readOnly = false,
  layout = "workspace",
}: ModelDerivedFactorsPanelProps) {
  const { confirm } = useConfirm();
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;
  const isWorkspace = layout === "workspace";
  usePrefetchWorkspace(WORKSPACE_SLUGS.DERIVED_FACTOR_FORM);
  const derivedQuery = useDerivedFactors(modelId);
  const { createMutation, deleteMutation } = useDerivedFactorMutations(modelId);
  const { data: factorInstances } = useModelFactorInstances(modelId);

  const [createOpen, setCreateOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceFactorId, setWorkspaceFactorId] = useState<string | null>(null);
  const [workspaceInitialTab, setWorkspaceInitialTab] = useState<"details" | "formula">("details");

  const items = derivedQuery.data ?? [];

  const variablePool = useMemo(
    () =>
      buildFormulaVariablePool({
        factorInstances: factorInstances ?? [],
        derivedFactors: items,
        excludeDerivedFactorId: workspaceFactorId,
      }),
    [factorInstances, items, workspaceFactorId],
  );

  const formulaStatusQueries = useQueries({
    queries: items.map((item) => ({
      queryKey: ["formula-by-target", modelId, "derived_factor", item.id],
      queryFn: async () =>
        (await getFormulaByTarget(modelId, "derived_factor", item.id)).data,
      staleTime: 30_000,
    })),
  });

  const formulaPayloadById = useMemo(() => {
    const map = new Map<string, unknown>();
    items.forEach((item, index) => {
      map.set(item.id, formulaStatusQueries[index]?.data);
    });
    return map;
  }, [items, formulaStatusQueries]);

  const canEdit = !readOnly;

  function openWorkspace(
    factorId: string,
    tab: "details" | "formula" = "details",
  ) {
    setWorkspaceFactorId(factorId);
    setWorkspaceInitialTab(tab);
    setWorkspaceOpen(true);
  }

  async function handleDeleteRow(row: DerivedFactorDefinitionDto) {
    if (!canEdit) {
      return;
    }
    const ok = await confirm({
      title: `Delete “${row.displayName}”?`,
      description:
        "Removes this derived factor and its formula. This cannot be undone.",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) {
      return;
    }
    await deleteMutation.mutateAsync(row.id);
  }

  const columns = useMemo((): DataTableColumn<DerivedFactorDefinitionDto>[] => {
    const cols: DataTableColumn<DerivedFactorDefinitionDto>[] = [
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
        id: "unit",
        header: "Unit",
        className: isWorkspace ? "text-[#71717a]" : "text-muted-foreground",
        cell: (row) => formatCell(row.unitCode),
      },
      {
        id: "status",
        header: "Definition",
        cell: (row) => <StatusBadge status={row.statusCode} />,
      },
      {
        id: "formula",
        header: "Formula",
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
                  ? "text-[#a1a1aa] hover:bg-white/[0.04] hover:text-[#f4f4f5]"
                  : undefined,
              )}
              onClick={(event) => {
                event.stopPropagation();
                openWorkspace(row.id, "details");
              }}
            >
              {readOnly ? (
                <Eye className="size-3.5" aria-hidden />
              ) : (
                <Settings2 className="size-3.5" aria-hidden />
              )}
              {readOnly ? "View" : "Manage"}
            </Button>
            {!readOnly ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-[#a1a1aa] hover:bg-white/[0.04] hover:text-cyan-200"
                  onClick={(event) => {
                    event.stopPropagation();
                    openWorkspace(row.id, "formula");
                  }}
                >
                  <Pencil className="size-3.5" aria-hidden />
                  Formula
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
            ) : null}
          </div>
        ),
      },
    ];
    return cols;
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

  const emptyMessage = canEdit ? (
    <div
      className={cn(
        "rounded-xl border border-dashed px-6 py-10 text-center",
        isWorkspace
          ? "border-white/10 bg-[#0f0f11] text-[#71717a]"
          : "border-border bg-muted/20 text-muted-foreground",
      )}
    >
      <p className="text-sm">
        No derived factors yet. Create one to define a computed value from raw model factors.
      </p>
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
    </div>
  ) : (
    <div
      className={cn(
        "rounded-xl border border-dashed px-6 py-10 text-center text-sm",
        isWorkspace ? "border-white/10 text-[#71717a]" : "text-muted-foreground",
      )}
    >
      <p>No derived factors on this model.</p>
      <p className="mt-2 text-xs text-amber-400/90">
        <Link href={`/models/${modelId}/edit`} className="text-cyan-300 underline-offset-2 hover:underline">
          Edit the model
        </Link>{" "}
        to create derived factors.
      </p>
    </div>
  );

  if (derivedQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between gap-3">{createButton}</div>
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
            Computed aliases from raw factors ({items.length} total). Manage details, formulas,
            and lifecycle here.
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
          onRowClick={(row) => openWorkspace(row.id, "details")}
        />
      ) : (
        <DataTable
          columns={columns}
          items={items}
          getRowKey={(row) => row.id}
          onRowClick={(row) => openWorkspace(row.id, "details")}
        />
      )}

      <CreateDerivedFactorDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isSubmitting={createMutation.isPending}
        onSubmit={async (payload) => {
          const created = await createMutation.mutateAsync(payload);
          setCreateOpen(false);
          openWorkspace(created.id, "formula");
        }}
      />

      <DerivedFactorWorkspaceDialog
        open={workspaceOpen}
        onOpenChange={setWorkspaceOpen}
        modelId={modelId}
        derivedFactorId={workspaceFactorId}
        readOnly={readOnly}
        variablePool={variablePool}
        initialTab={workspaceInitialTab}
        onDeleted={() => {
          setWorkspaceFactorId(null);
        }}
      />
    </div>
  );
}
