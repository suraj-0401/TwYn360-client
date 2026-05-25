"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import { PlatformShell } from "@/components/layout/platform-shell";
import { WorkspaceContainer } from "@/components/layout/workspace-container";
import { WorkspaceContent } from "@/components/layout/workspace-content";
import { RegistryViewEditButton } from "@/components/layout/registry-view-edit-button";
import { QueryErrorState } from "@/components/feedback";
import { DynamicFormSkeleton } from "@/renderer/components/dynamic-form-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { EntityRecordForm } from "@/modules/platform/components/entity-record-form";
import { ENTITY_TYPE, isArchivedLifecycle } from "@/config/platform";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { env } from "@/config/env";
import { useRegistryViewMode } from "@/hooks/use-registry-view-mode";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
  archiveEntityRecord,
  getEntityRecord,
  updateEntityRecord,
} from "@/services/entity-record.service";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

function categoryTitle(data: {
  displayName?: string | null;
  values: Record<string, unknown>;
}): string {
  const name = data.values.name;
  if (typeof name === "string" && name.trim()) {
    return name;
  }
  return data.displayName ?? "Category";
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [builderMode, setBuilderMode] = useState(false);
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;

  usePrefetchWorkspace(WORKSPACE_SLUGS.CATEGORY_FORM);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["category", id],
    queryFn: async () => (await getEntityRecord(ENTITY_TYPE.CATEGORY, id)).data,
    staleTime: 60_000,
  });

  const viewMode = useRegistryViewMode();
  const readOnly =
    viewMode || (data ? isArchivedLifecycle(data.status) : false);

  async function handleSubmit(payload: Record<string, unknown>) {
    await updateEntityRecord(ENTITY_TYPE.CATEGORY, id, payload);
    toast.success("Category saved");
    void queryClient.invalidateQueries({ queryKey: ["categories"] });
    void queryClient.invalidateQueries({ queryKey: ["category", id] });
    router.push("/categories");
  }

  async function handleArchive() {
    await archiveEntityRecord(ENTITY_TYPE.CATEGORY, id);
    toast.success("Category archived");
    void queryClient.invalidateQueries({ queryKey: ["categories"] });
    router.push("/categories");
  }

  const showSkeleton = isLoading && !data;

  return (
    <PlatformShell
      domainId="registry"
      breadcrumbs={[
        { label: "Registry", href: "/categories" },
        { label: "Categories", href: "/categories" },
        { label: data ? categoryTitle(data) : "Category" },
      ]}
      contextLine="Therapeutic area metadata"
      topbarActions={
        data ? (
          viewMode ? (
            <RegistryViewEditButton editHref={`/categories/${id}/edit`} />
          ) : (
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
                href="/categories"
                className="block px-3 py-2 text-sm text-[#a1a1aa] hover:bg-white/[0.04]"
              >
                All categories
              </Link>
              {!readOnly && !builderMode ? (
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm text-[#a1a1aa] hover:bg-white/[0.04]"
                  onClick={() => void handleArchive()}
                >
                  Archive
                </button>
              ) : null}
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
          )
        ) : null
      }
    >
      <WorkspaceContainer>
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
          <WorkspaceContent>
            <EntityRecordForm
              workspaceSlug={WORKSPACE_SLUGS.CATEGORY_FORM}
              initial={data}
              submitLabel="Save changes"
              onSubmit={handleSubmit}
              adminKey={adminKey}
              editable={builderMode}
            />
          </WorkspaceContent>
        ) : null}
      </WorkspaceContainer>
    </PlatformShell>
  );
}
