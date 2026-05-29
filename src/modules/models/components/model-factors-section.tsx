"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { WorkspaceTabs } from "@/components/layout/workspace-tabs";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-table/data-table";
import { PlatformDataTable } from "@/components/data-table/platform-data-table";
import { QueryErrorState } from "@/components/feedback";
import { FactorTableSkeleton } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";
import {
  useModelFactorInstanceConfigure,
  useModelFactorInstances,
} from "../hooks/use-model-factor-instances";
import {
  isFactorSetUnavailable,
  preservedFactorsTabBanner,
} from "../utils/factor-set-lifecycle";
import { ModelFactorInstanceConfigureDialog } from "./model-factor-instance-configure-dialog";
import { ModelDerivedFactorsPanel } from "./model-derived-factors-panel";
import type { ResolvedModelFactorInstance } from "@/types/model-factor-instance";
import { StatusBadge } from "@/components/data-table/status-badge";

type FactorsSubTabId = "raw" | "derived";

const FACTORS_SUB_TABS = [
  { id: "raw" as const, label: "Raw" },
  { id: "derived" as const, label: "Derived" },
];

type ModelFactorsSectionProps = {
  modelId: string;
  readOnly?: boolean;
  graphLocked?: boolean;
  layout?: "default" | "workspace";
};

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}

function ModelRawFactorsPanel({
  modelId,
  readOnly,
  graphLocked,
  layout,
}: ModelFactorsSectionProps) {
  const { data, isLoading, error, refetch, isRefetching } =
    useModelFactorInstances(modelId);
  const { loadInstance, saveOverrides } = useModelFactorInstanceConfigure(modelId);

  const [configureOpen, setConfigureOpen] = useState(false);
  const [selected, setSelected] = useState<ResolvedModelFactorInstance | null>(
    null,
  );
  const [loadingInstance, setLoadingInstance] = useState(false);

  const isWorkspace = layout === "workspace";
  const items = data ?? [];
  const preservedFromUnavailableSetCount = items.filter(
    (row) =>
      row.sourceFactorSet &&
      isFactorSetUnavailable(row.sourceFactorSet.statusCode),
  ).length;

  const columns = useMemo((): DataTableColumn<ResolvedModelFactorInstance>[] => {
    const cols: DataTableColumn<ResolvedModelFactorInstance>[] = [
      {
        id: "factor",
        header: "Factor",
        cell: (row) => (
          <div className="min-w-0">
            <div
              className={cn(
                "truncate font-medium",
                isWorkspace ? "text-[#f4f4f5]" : undefined,
              )}
            >
              {row.resolved.displayName}
            </div>
            <p
              className={cn(
                "truncate text-xs",
                isWorkspace ? "text-[#52525b]" : "text-muted-foreground",
              )}
            >
              {row.factor.slug}
            </p>
          </div>
        ),
      },
      {
        id: "source",
        header: "Factor set",
        cell: (row) => (
          <div className="min-w-0 space-y-1">
            {row.sourceFactorSet ? (
              <>
                <span
                  className={cn(
                    "block truncate text-sm",
                    isWorkspace ? "text-[#71717a]" : "text-muted-foreground",
                  )}
                >
                  {row.sourceFactorSet.displayName}
                </span>
                {isFactorSetUnavailable(row.sourceFactorSet.statusCode) ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={row.sourceFactorSet.statusCode} />
                    {graphLocked ? (
                      <span className="text-xs text-sky-300/80">Preserved</span>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              "—"
            )}
          </div>
        ),
      },
      {
        id: "unit",
        header: "Unit",
        className: isWorkspace ? "text-[#71717a]" : "text-muted-foreground",
        cell: (row) => formatCell(row.resolved.unitCode),
      },
      {
        id: "required",
        header: "Required",
        className: isWorkspace ? "text-[#71717a]" : "text-muted-foreground",
        cell: (row) => formatCell(row.resolved.required),
      },
      {
        id: "overrides",
        header: "Overrides",
        cell: (row) =>
          row.hasOverrides ? (
            <span className="inline-flex rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-200/90">
              Custom
            </span>
          ) : (
            <span
              className={cn(
                "text-xs",
                isWorkspace ? "text-[#52525b]" : "text-muted-foreground",
              )}
            >
              Registry
            </span>
          ),
      },
      {
        id: "actions",
        header: "",
        className: "w-[1%] whitespace-nowrap text-right",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Link
              href={`/factors/${row.factor.id}`}
              className={cn(
                "text-xs",
                isWorkspace ? platform.link : "text-primary hover:underline",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              Registry
            </Link>
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
              onClick={(e) => {
                e.stopPropagation();
                void openConfigure(row);
              }}
            >
              <Settings2 className="size-3.5" aria-hidden />
              {readOnly ? "View" : "Configure"}
            </Button>
          </div>
        ),
      },
    ];
    return cols;
  }, [isWorkspace, readOnly, graphLocked]);

  async function openConfigure(row: ResolvedModelFactorInstance) {
    setLoadingInstance(true);
    try {
      const fresh = await loadInstance(row.id);
      setSelected(fresh);
      setConfigureOpen(true);
    } finally {
      setLoadingInstance(false);
    }
  }

  if (error) {
    return (
      <QueryErrorState
        error={error}
        context={{ resource: "model factors" }}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    );
  }

  if (isLoading) {
    return <FactorTableSkeleton />;
  }

  const emptyMessage = (
    <p
      className={cn(
        "rounded-lg border border-dashed px-4 py-8 text-center text-sm",
        isWorkspace
          ? "border-white/10 text-[#71717a]"
          : "text-muted-foreground",
      )}
    >
      No factors on this model yet. Attach factor sets on the Factor sets tab
      (draft models only).
    </p>
  );

  return (
    <div className="space-y-6">
      <div>
        <p
          className={cn(
            "text-sm",
            isWorkspace ? "text-[#71717a]" : "text-muted-foreground",
          )}
        >
          Per-model configuration for each registry factor ({items.length}{" "}
          total). Overrides apply only to this model.
        </p>
        {readOnly ? (
          <p className="mt-2 text-xs text-amber-400/90">
            Archived or view-only — configuration cannot be changed.
          </p>
        ) : (
          <p className="mt-2 text-xs text-[#52525b]">
            Factor sets are edited on the Factor sets tab (draft only). Configure
            overrides here — use Clear override, not delete. Instance rows stay for
            formulas and audit.
          </p>
        )}
        {graphLocked && preservedFromUnavailableSetCount > 0 ? (
          <p className="mt-2 rounded-md border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-xs leading-relaxed text-sky-200/90">
            {preservedFactorsTabBanner(preservedFromUnavailableSetCount)}
          </p>
        ) : null}
      </div>

      {isWorkspace ? (
        <PlatformDataTable
          columns={columns}
          items={items}
          getRowKey={(row) => row.id}
          emptyMessage={emptyMessage}
        />
      ) : (
        <DataTable
          columns={columns}
          items={items}
          getRowKey={(row) => row.id}
          emptyMessage={emptyMessage}
        />
      )}

      <ModelFactorInstanceConfigureDialog
        open={configureOpen && !loadingInstance}
        onOpenChange={setConfigureOpen}
        instance={selected}
        readOnly={readOnly}
        onSave={saveOverrides}
      />
    </div>
  );
}

export function ModelFactorsSection({
  modelId,
  readOnly = false,
  graphLocked = false,
  layout = "workspace",
}: ModelFactorsSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<FactorsSubTabId>("raw");
  const isWorkspace = layout === "workspace";

  return (
    <div className="space-y-6">
      <div>
        <h2
          className={cn(
            "text-lg font-semibold tracking-tight",
            isWorkspace ? "text-[#f4f4f5]" : undefined,
          )}
        >
          Model factors
        </h2>
        <p
          className={cn(
            "mt-1 text-sm",
            isWorkspace ? "text-[#71717a]" : "text-muted-foreground",
          )}
        >
          Raw registry factors and derived computed aliases for this model.
        </p>
      </div>

      <WorkspaceTabs
        tabs={[...FACTORS_SUB_TABS]}
        activeId={activeSubTab}
        onChange={(id) => setActiveSubTab(id as FactorsSubTabId)}
        className="rounded-lg border border-white/[0.06]"
      />

      {activeSubTab === "raw" ? (
        <ModelRawFactorsPanel
          modelId={modelId}
          readOnly={readOnly}
          graphLocked={graphLocked}
          layout={layout}
        />
      ) : (
        <ModelDerivedFactorsPanel
          modelId={modelId}
          readOnly={graphLocked}
          layout={layout}
        />
      )}
    </div>
  );
}
