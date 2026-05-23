"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { QueryErrorState } from "@/components/feedback";
import { DynamicFormSkeleton } from "@/renderer/components/dynamic-form-skeleton";
import { Button } from "@/components/ui/button";
import { EntityRecordForm } from "@/modules/platform/components/entity-record-form";
import { FactorPageHeader } from "@/modules/factors/components/factor-page-header";
import { ENTITY_TYPE, isArchivedLifecycle } from "@/config/platform";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { env } from "@/config/env";
import { toast } from "@/lib/toast";
import {
  archiveEntityRecord,
  getEntityRecord,
  updateEntityRecord,
} from "@/services/entity-record.service";

type EditDrugPageProps = {
  params: Promise<{ id: string }>;
};

export default function EditDrugPage({ params }: EditDrugPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [builderMode, setBuilderMode] = useState(false);
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;

  usePrefetchWorkspace(WORKSPACE_SLUGS.DRUG_FORM);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["drug", id],
    queryFn: async () => {
      const response = await getEntityRecord(ENTITY_TYPE.DRUG, id);
      return response.data;
    },
    staleTime: 60_000,
  });

  async function handleSubmit(payload: Record<string, unknown>) {
    await updateEntityRecord(ENTITY_TYPE.DRUG, id, payload);
    toast.success("Drug saved");
    void queryClient.invalidateQueries({ queryKey: ["drugs"] });
    void queryClient.invalidateQueries({ queryKey: ["drug", id] });
    router.push("/drugs");
  }

  async function handleArchive() {
    await archiveEntityRecord(ENTITY_TYPE.DRUG, id);
    toast.success("Drug archived");
    void queryClient.invalidateQueries({ queryKey: ["drugs"] });
    router.push("/drugs");
  }

  const showSkeleton = isLoading && !data;

  return (
    <AppShell document>
      <FactorPageHeader
        title="Edit drug"
        subtitle={
          data?.displayName ?? data?.values?.name?.toString() ?? undefined
        }
        builderMode={builderMode}
        onBuilderModeChange={setBuilderMode}
        showBuilderToggle={Boolean(adminKey)}
        actions={
          !builderMode && data && !isArchivedLifecycle(data.status) ? (
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="border-white/10 bg-transparent text-[#f4f4f5] hover:bg-white/5"
              onClick={() => void handleArchive()}
            >
              Archive
            </Button>
          ) : null
        }
      />

      {error ? (
        <QueryErrorState
          error={error}
          context={{ resource: "this drug" }}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      ) : null}

      {showSkeleton ? <DynamicFormSkeleton /> : null}

      {data && !error ? (
        <EntityRecordForm
          workspaceSlug={WORKSPACE_SLUGS.DRUG_FORM}
          initial={data}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          showCategoryPicker={!builderMode}
          adminKey={adminKey}
          editable={builderMode}
        />
      ) : null}
    </AppShell>
  );
}
