"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BuilderModeToggle } from "@/components/layout/builder-mode-toggle";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformPageShell } from "@/components/layout/platform-page-shell";
import { EntityRecordForm } from "@/modules/platform/components/entity-record-form";
import { ENTITY_TYPE } from "@/config/platform";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { env } from "@/config/env";
import { toast } from "@/lib/toast";
import { createEntityRecord } from "@/services/entity-record.service";

export default function NewCategoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [builderMode, setBuilderMode] = useState(false);
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;

  usePrefetchWorkspace(WORKSPACE_SLUGS.CATEGORY_FORM);

  async function handleSubmit(payload: Record<string, unknown>) {
    await createEntityRecord(ENTITY_TYPE.CATEGORY, payload);
    toast.success("Category created");
    void queryClient.invalidateQueries({ queryKey: ["categories"] });
    void queryClient.invalidateQueries({ queryKey: ["category-options"] });
    router.push("/categories");
  }

  return (
    <PlatformPageShell
      domainId="registry"
      breadcrumbs={[
        { label: "Registry", href: "/categories" },
        { label: "Categories", href: "/categories" },
        { label: "New category" },
      ]}
      topbarActions={
        adminKey ? (
          <BuilderModeToggle
            enabled={builderMode}
            onChange={setBuilderMode}
            variant="platform"
          />
        ) : null
      }
    >
      <PageHeader
        title="New category"
        description="Define a therapeutic area or program grouping."
      />
      <EntityRecordForm
        workspaceSlug={WORKSPACE_SLUGS.CATEGORY_FORM}
        submitLabel="Create category"
        onSubmit={handleSubmit}
        adminKey={adminKey}
        editable={builderMode}
      />
    </PlatformPageShell>
  );
}
