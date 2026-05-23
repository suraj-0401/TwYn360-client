"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import {
  FactorTableSkeleton,
  QueryErrorState,
} from "@/components/feedback";
import { FactorPageHeader } from "@/modules/factors/components/factor-page-header";
import { FactorSetForm } from "@/modules/factor-sets/components/factor-set-form";
import type { FactorSetFormValues } from "@/modules/factor-sets/components/factor-set-form";
import { FactorSetMembersSection } from "@/modules/factor-sets/components/factor-set-members-section";
import { isArchivedLifecycle } from "@/config/lifecycle";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { env } from "@/config/env";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
  archiveFactorSet,
  getFactorSet,
  updateFactorSet,
} from "@/services/factor-set.service";

type EditFactorSetPageProps = {
  params: Promise<{ id: string }>;
};

export default function EditFactorSetPage({ params }: EditFactorSetPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [builderMode, setBuilderMode] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;

  usePrefetchWorkspace(WORKSPACE_SLUGS.FACTOR_SET_FORM);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["factor-set", id],
    queryFn: async () => {
      const response = await getFactorSet(id);
      return response.data;
    },
    staleTime: 60_000,
  });

  const readOnly = data ? isArchivedLifecycle(data.statusCode) : false;

  async function handleSubmit(payload: FactorSetFormValues) {
    await updateFactorSet(id, payload);
    toast.success("Factor set saved");
    void queryClient.invalidateQueries({ queryKey: ["factor-sets"] });
    void queryClient.invalidateQueries({ queryKey: ["factor-set", id] });
  }

  async function handleArchive() {
    if (
      !window.confirm(
        "Archive this factor set? Membership changes will be disabled.",
      )
    ) {
      return;
    }

    setArchiving(true);
    try {
      await archiveFactorSet(id);
      toast.success("Factor set archived");
      void queryClient.invalidateQueries({ queryKey: ["factor-sets"] });
      void queryClient.invalidateQueries({ queryKey: ["factor-set", id] });
      router.push("/factor-sets");
    } finally {
      setArchiving(false);
    }
  }

  const showSkeleton = isLoading && !data;

  return (
    <AppShell document>
      <FactorPageHeader
        title={data ? `Edit: ${data.displayName}` : "Edit factor set"}
        subtitle="Update set metadata and manage ordered factor membership."
        builderMode={builderMode}
        onBuilderModeChange={setBuilderMode}
        showBuilderToggle={Boolean(adminKey) && !readOnly}
        actions={
          <>
            <Link
              href="/factor-sets"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-white/10 bg-transparent text-[#f4f4f5] hover:bg-white/5",
              )}
            >
              Back
            </Link>
            {data && !isArchivedLifecycle(data.statusCode) ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={archiving}
                onClick={() => void handleArchive()}
                className="border-white/10 bg-transparent text-[#f4f4f5] hover:bg-white/5"
              >
                {archiving ? "Archiving…" : "Archive"}
              </Button>
            ) : null}
          </>
        }
      />

      {error ? (
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
      ) : null}

      {showSkeleton ? <FactorTableSkeleton /> : null}

      {data && !error ? (
        <div className="space-y-6">
          {!builderMode ? (
            <FactorSetForm
              initial={data}
              submitLabel="Save changes"
              onSubmit={handleSubmit}
              readOnly={readOnly}
              adminKey={adminKey}
            />
          ) : (
            <FactorSetForm
              initial={data}
              submitLabel="Save changes"
              onSubmit={handleSubmit}
              adminKey={adminKey}
              editable
            />
          )}

          {!builderMode ? (
            <FactorSetMembersSection
              mode="persisted"
              factorSetId={id}
              members={data.members}
              readOnly={readOnly}
            />
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
