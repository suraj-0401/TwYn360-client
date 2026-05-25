"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PlatformShell } from "@/components/layout/platform-shell";
import { WorkspaceContainer } from "@/components/layout/workspace-container";
import { FactorTableSkeleton, QueryErrorState } from "@/components/feedback";
import { buttonVariants } from "@/components/ui/button";
import { formatLifecycleStatus } from "@/config/lifecycle";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { cn } from "@/lib/utils";
import { getModel } from "@/services/model.service";
import { ModelWorkspace } from "@/modules/models/components/model-workspace";

type ViewModelPageProps = {
  params: Promise<{ id: string }>;
};

export default function ViewModelPage({ params }: ViewModelPageProps) {
  const { id } = use(params);

  usePrefetchWorkspace(WORKSPACE_SLUGS.MODEL_FORM);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["models", id],
    queryFn: async () => (await getModel(id)).data,
    staleTime: 60_000,
  });

  const showSkeleton = isLoading && !data;

  const contextLine = data ? (
    <>
      {formatLifecycleStatus(data.statusCode)}
      {" · "}
      {data.factorSetCount} factor set{data.factorSetCount === 1 ? "" : "s"}
      {" · "}
      Read-only
    </>
  ) : undefined;

  return (
    <PlatformShell
      domainId="workspace"
      breadcrumbs={[
        { label: "Workspace", href: "/models" },
        { label: "Models", href: "/models" },
        { label: data?.displayName ?? "Model" },
      ]}
      contextLine={contextLine}
      topbarActions={
        data ? (
          <Link
            href={`/models/${id}/edit`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04]",
            )}
          >
            Edit
          </Link>
        ) : null
      }
    >
      <WorkspaceContainer flush fill className="h-full">
        {error ? (
          <div className="p-6">
            <QueryErrorState
              error={error}
              context={{ resource: "model" }}
              onRetry={() => refetch()}
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
            readOnly
            onSubmit={async () => {}}
          />
        ) : null}
      </WorkspaceContainer>
    </PlatformShell>
  );
}
