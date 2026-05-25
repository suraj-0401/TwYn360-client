"use client";

import { use, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlatformShell } from "@/components/layout/platform-shell";
import { WorkspaceContainer } from "@/components/layout/workspace-container";
import {
  FactorTableSkeleton,
  QueryErrorState,
} from "@/components/feedback";
import { toast } from "@/lib/toast";
import {
  formatLifecycleStatus,
  isArchivedLifecycle,
} from "@/config/lifecycle";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { ModelWorkspace } from "@/modules/models/components/model-workspace";
import { getModel, updateModel } from "@/services/model.service";
import type { UpdateModelPayload } from "@/types/model";

type EditModelPageProps = {
  params: Promise<{ id: string }>;
};

function drugLabel(drug: {
  displayName: string | null;
  slug: string | null;
  id: string;
}): string {
  return drug.displayName || drug.slug || drug.id;
}

export default function EditModelPage({ params }: EditModelPageProps) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  usePrefetchWorkspace(WORKSPACE_SLUGS.MODEL_FORM);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["models", id],
    queryFn: async () => (await getModel(id)).data,
    staleTime: 60_000,
  });

  const readOnly = data ? isArchivedLifecycle(data.statusCode) : false;

  const contextLine = useMemo(() => {
    if (!data) {
      return undefined;
    }
    const drug = drugLabel(data.drug);
    const status = formatLifecycleStatus(data.statusCode);
    const sets = `${data.factorSetCount} factor set${data.factorSetCount === 1 ? "" : "s"}`;
    return (
      <>
        {drug}
        {" · "}
        {status}
        {" · "}
        {sets}
      </>
    );
  }, [data]);

  async function handleSubmit(payload: UpdateModelPayload) {
    await updateModel(id, payload);
    toast.success("Model saved");
    void queryClient.invalidateQueries({ queryKey: ["models"] });
    void queryClient.invalidateQueries({ queryKey: ["models", id] });
    if (data?.drugId) {
      void queryClient.invalidateQueries({
        queryKey: ["drug-models", data.drugId],
      });
    }
  }

  const showSkeleton = isLoading && !data;

  return (
    <PlatformShell
      domainId="workspace"
      breadcrumbs={[
        { label: "Workspace", href: "/models" },
        { label: "Models", href: "/models" },
        { label: data?.displayName ?? "Model" },
      ]}
      contextLine={contextLine}
    >
      <WorkspaceContainer flush fill className="h-full">
        {error ? (
          <div className="p-6">
            <QueryErrorState
              error={error}
              context={{ resource: "model" }}
              onRetry={() => {
                void queryClient.invalidateQueries({ queryKey: ["models", id] });
                void refetch();
              }}
              isRetrying={isRefetching}
            />
          </div>
        ) : null}

        {showSkeleton ? (
          <div className="p-6">
            <FactorTableSkeleton />
          </div>
        ) : null}

        {data && !error ? (
          <ModelWorkspace
            model={data}
            readOnly={readOnly}
            onSubmit={handleSubmit}
          />
        ) : null}
      </WorkspaceContainer>
    </PlatformShell>
  );
}
