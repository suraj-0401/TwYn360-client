"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { QueryErrorState } from "@/components/feedback";
import { DynamicFormSkeleton } from "@/renderer/components/dynamic-form-skeleton";
import { CategoryDangerZone } from "@/modules/platform/components/category-danger-zone";
import { EntityRecordForm } from "@/modules/platform/components/entity-record-form";
import { FactorPageHeader } from "@/modules/factors/components/factor-page-header";
import { ENTITY_TYPE, isDeletedLifecycle } from "@/config/platform";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { env } from "@/config/env";
import { toast } from "@/lib/toast";
import {
  getEntityRecord,
  updateEntityRecord,
} from "@/services/entity-record.service";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [builderMode, setBuilderMode] = useState(false);
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;

  usePrefetchWorkspace(WORKSPACE_SLUGS.CATEGORY_FORM);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      const response = await getEntityRecord(ENTITY_TYPE.CATEGORY, id);
      return response.data;
    },
    staleTime: 60_000,
  });

  async function handleSubmit(payload: Record<string, unknown>) {
    await updateEntityRecord(ENTITY_TYPE.CATEGORY, id, payload);
    toast.success("Category saved");
    void queryClient.invalidateQueries({ queryKey: ["categories"] });
    void queryClient.invalidateQueries({ queryKey: ["category", id] });
    void queryClient.invalidateQueries({ queryKey: ["category-options"] });
    router.push("/categories");
  }

  const showSkeleton = isLoading && !data;

  return (
    <AppShell document>
      <FactorPageHeader
        title="Edit category"
        subtitle={
          data?.displayName ?? data?.values?.name?.toString() ?? undefined
        }
        builderMode={builderMode}
        onBuilderModeChange={setBuilderMode}
        showBuilderToggle={Boolean(adminKey)}
        actions={null}
      />

      {error ? (
        <QueryErrorState
          error={error}
          context={{ resource: "this category" }}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      ) : null}

      {showSkeleton ? <DynamicFormSkeleton /> : null}

      {data && !error ? (
        <div className="space-y-8">
          <EntityRecordForm
            workspaceSlug={WORKSPACE_SLUGS.CATEGORY_FORM}
            initial={data}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
            adminKey={adminKey}
            editable={builderMode}
          />
          {!builderMode && !isDeletedLifecycle(data.status) ? (
            <CategoryDangerZone category={data} />
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
