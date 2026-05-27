"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { BuilderModeToggle } from "@/components/layout/builder-mode-toggle";
import { PlatformShell } from "@/components/layout/platform-shell";
import { WorkspaceContainer } from "@/components/layout/workspace-container";
import { LoadingButton } from "@/components/feedback/loaders/loading-button";
import {
  FactorTableSkeleton,
  QueryErrorState,
} from "@/components/feedback";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/feedback";
import {
  MUTATION_ACTION_LABEL,
  MUTATION_SUCCESS_MESSAGE,
  mutationConfirm,
} from "@/config/mutation-labels";
import { toast } from "@/lib/toast";
import {
  formatLifecycleStatus,
  isArchivedLifecycle,
} from "@/config/lifecycle";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { env } from "@/config/env";
import { useRegistryViewMode } from "@/hooks/use-registry-view-mode";
import { platform } from "@/styles/tokens";
import { RegistryViewEditButton } from "@/components/layout/registry-view-edit-button";
import { FactorSetMembersButton } from "@/modules/factor-sets/components/factor-set-members-button";
import { FactorSetMembersModal } from "@/modules/factor-sets/components/factor-set-members-modal";
import { FactorSetWorkspace } from "@/modules/factor-sets/components/factor-set-workspace";
import { FACTOR_SET_WORKSPACE_FORM_ID } from "@/modules/factor-sets/components/factor-set-workspace/constants";
import type { FactorSetFormValues } from "@/modules/factor-sets/components/factor-set-form";
import {
  archiveFactorSet,
  getFactorSet,
  updateFactorSet,
} from "@/services/factor-set.service";
import { getFactorSetUsageImpact } from "@/services/governance-impact.service";

type EditFactorSetPageProps = {
  params: Promise<{ id: string }>;
};

export default function EditFactorSetPage({ params }: EditFactorSetPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [builderMode, setBuilderMode] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const { confirm } = useConfirm();
  const [saving, setSaving] = useState(false);
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;

  usePrefetchWorkspace(WORKSPACE_SLUGS.FACTOR_SET_FORM);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["factor-set", id],
    queryFn: async () => (await getFactorSet(id)).data,
    staleTime: 60_000,
  });

  const viewMode = useRegistryViewMode();
  const readOnly =
    viewMode || (data ? isArchivedLifecycle(data.statusCode) : false);
  const canArchive =
    data && !viewMode && !isArchivedLifecycle(data.statusCode);

  async function handleSubmit(payload: FactorSetFormValues) {
    await updateFactorSet(id, payload);
    toast.success("Factor set saved");
    void queryClient.invalidateQueries({ queryKey: ["factor-sets"] });
    void queryClient.invalidateQueries({ queryKey: ["factor-set", id] });
  }

  async function handleArchive() {
    let impact;
    try {
      impact = (await getFactorSetUsageImpact(id)).data;
    } catch {
      impact = undefined;
    }
    const ok = await confirm(mutationConfirm.archiveFactorSet(impact));
    if (!ok) {
      return;
    }

    setArchiving(true);
    try {
      await archiveFactorSet(id);
      toast.success(MUTATION_SUCCESS_MESSAGE.factorSetArchived);
      void queryClient.invalidateQueries({ queryKey: ["factor-sets"] });
      void queryClient.invalidateQueries({ queryKey: ["factor-set", id] });
      router.push("/factor-sets");
    } finally {
      setArchiving(false);
    }
  }

  const showSkeleton = isLoading && !data;

  const contextLine = data ? (
    <>
      {formatLifecycleStatus(data.statusCode)}
      {" · "}
      {data.memberCount} factor{data.memberCount === 1 ? "" : "s"}
    </>
  ) : undefined;

  return (
    <PlatformShell
      domainId="registry"
      breadcrumbs={[
        { label: "Registry", href: "/factor-sets" },
        { label: "Factor sets", href: "/factor-sets" },
        { label: data?.displayName ?? "Factor set" },
      ]}
      contextLine={contextLine}
      topbarActions={
        data ? (
          viewMode ? (
            <div className="flex items-center gap-2">
              <RegistryViewEditButton editHref={`/factor-sets/${id}/edit`} />
            </div>
          ) : (
          <div className="flex items-center gap-2">
            {adminKey ? (
              <BuilderModeToggle
                enabled={builderMode}
                onChange={setBuilderMode}
                variant="platform"
              />
            ) : null}
            {!readOnly && !builderMode ? (
              <LoadingButton
                type="submit"
                form={FACTOR_SET_WORKSPACE_FORM_ID}
                size="sm"
                loading={saving}
                loadingText="Saving…"
                className={cn(platform.primaryButton, "min-w-[72px]")}
              >
                Save
              </LoadingButton>
            ) : null}
            {canArchive ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={archiving}
                className="border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04]"
                onClick={() => void handleArchive()}
              >
                {archiving ? "Archiving…" : MUTATION_ACTION_LABEL.archiveFactorSet}
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
                  href="/factor-sets"
                  className="block px-3 py-2 text-sm text-[#a1a1aa] hover:bg-white/[0.04]"
                >
                  All factor sets
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
              context={{ resource: "factor set" }}
              onRetry={() => {
                void queryClient.invalidateQueries({
                  queryKey: ["factor-set", id],
                });
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
          <>
            {!builderMode ? (
              <div className="flex shrink-0 items-center justify-end border-b border-white/[0.06] px-4 py-3 md:px-6">
                <FactorSetMembersButton
                  memberCount={data.memberCount}
                  onClick={() => setMembersOpen(true)}
                />
              </div>
            ) : null}
            <FactorSetWorkspace
              factorSet={data}
              readOnly={readOnly}
              builderMode={builderMode}
              adminKey={adminKey}
              onSubmit={handleSubmit}
              onSavingChange={setSaving}
            />
            <FactorSetMembersModal
              open={membersOpen}
              onOpenChange={setMembersOpen}
              mode="persisted"
              factorSetId={data.id}
              members={data.members}
              readOnly={readOnly}
            />
          </>
        ) : null}
      </WorkspaceContainer>
    </PlatformShell>
  );
}
