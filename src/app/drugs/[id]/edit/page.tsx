"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { PlatformShell } from "@/components/layout/platform-shell";
import { WorkspaceContainer } from "@/components/layout/workspace-container";
import { QueryErrorState } from "@/components/feedback";
import { DynamicFormSkeleton } from "@/renderer/components/dynamic-form-skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { RegistryViewEditButton } from "@/components/layout/registry-view-edit-button";
import { DrugRegistryWorkspace } from "@/modules/platform/components/drug-registry-workspace";
import { ENTITY_TYPE, isArchivedLifecycle } from "@/config/platform";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { env } from "@/config/env";
import { useRegistryViewMode } from "@/hooks/use-registry-view-mode";
import { formatApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
  archiveEntityRecord,
  getEntityRecord,
  updateEntityRecord,
} from "@/services/entity-record.service";

type EditDrugPageProps = {
  params: Promise<{ id: string }>;
};

function drugTitle(data: {
  displayName?: string | null;
  values: Record<string, unknown>;
}): string {
  const name = data.values.name;
  if (typeof name === "string" && name.trim()) {
    return name;
  }
  return data.displayName ?? "Drug";
}

export default function EditDrugPage({ params }: EditDrugPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [builderMode, setBuilderMode] = useState(false);
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;

  usePrefetchWorkspace(WORKSPACE_SLUGS.DRUG_FORM);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["drug", id],
    queryFn: async () => (await getEntityRecord(ENTITY_TYPE.DRUG, id)).data,
    staleTime: 60_000,
  });

  const viewMode = useRegistryViewMode();
  const readOnly =
    viewMode || (data ? isArchivedLifecycle(data.status) : false);
  const canArchive =
    data && !viewMode && !isArchivedLifecycle(data.status);

  async function handleSubmit(payload: Record<string, unknown>) {
    await updateEntityRecord(ENTITY_TYPE.DRUG, id, payload);
    toast.success("Drug saved");
    void queryClient.invalidateQueries({ queryKey: ["drugs"] });
    void queryClient.invalidateQueries({ queryKey: ["drug", id] });
  }

  async function handleArchive() {
    try {
      await archiveEntityRecord(ENTITY_TYPE.DRUG, id);
      toast.success("Drug archived");
      void queryClient.invalidateQueries({ queryKey: ["drugs"] });
      router.push("/drugs");
    } catch (err) {
      toast.error(formatApiError(err).message);
    }
  }

  const showSkeleton = isLoading && !data;

  const contextLine = data ? (
    <>
      {String(data.values.statusCode ?? data.status ?? "—")}
      {" · "}
      View models and metadata in tabs
    </>
  ) : undefined;

  return (
    <PlatformShell
      domainId="registry"
      breadcrumbs={[
        { label: "Registry", href: "/drugs" },
        { label: "Drugs", href: "/drugs" },
        { label: data ? drugTitle(data) : "Drug" },
      ]}
      contextLine={contextLine}
      topbarActions={
        data ? (
          viewMode ? (
            <RegistryViewEditButton editHref={`/drugs/${id}/edit`} />
          ) : (
          <div className="flex items-center gap-2">
            {canArchive && !builderMode ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04]"
                onClick={() => void handleArchive()}
              >
                Archive
              </Button>
            ) : null}
            <details className="relative">
              <summary
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "list-none cursor-pointer border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04] [&::-webkit-details-marker]:hidden",
                )}
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">More actions</span>
              </summary>
              <div className="absolute right-0 z-20 mt-1 min-w-[200px] rounded-md border border-white/[0.08] bg-[#111113] py-1 shadow-lg">
                <Link
                  href="/drugs"
                  className="block px-3 py-2 text-sm text-[#a1a1aa] hover:bg-white/[0.04]"
                >
                  All drugs
                </Link>
                <Link
                  href={`/models?drugId=${encodeURIComponent(id)}`}
                  className="block px-3 py-2 text-sm text-[#a1a1aa] hover:bg-white/[0.04]"
                >
                  View models
                </Link>
                {adminKey && !readOnly ? (
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm text-[#a1a1aa] hover:bg-white/[0.04]"
                    onClick={() => setBuilderMode((value) => !value)}
                  >
                    {builderMode ? "Exit form builder" : "Customize form"}
                  </button>
                ) : null}
              </div>
            </details>
          </div>
          )
        ) : null
      }
    >
      <WorkspaceContainer flush fill className="h-full">
        {error ? (
          <div className="p-6">
            <QueryErrorState
              error={error}
              context={{ resource: "this drug" }}
              onRetry={() => refetch()}
              isRetrying={isRefetching}
            />
          </div>
        ) : null}

        {showSkeleton ? (
          <div className="p-6">
            <DynamicFormSkeleton />
          </div>
        ) : null}

        {data && !error ? (
          <DrugRegistryWorkspace
            drug={data}
            drugId={id}
            builderMode={builderMode}
            adminKey={adminKey}
            onSubmit={handleSubmit}
          />
        ) : null}
      </WorkspaceContainer>
    </PlatformShell>
  );
}
