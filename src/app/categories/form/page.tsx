"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EntityFormLayoutEditor } from "@/modules/platform/components/entity-form-layout-editor";
import { FactorPageHeader } from "@/modules/factors/components/factor-page-header";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { env } from "@/config/env";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { useEffect } from "react";

export default function CategoryFormLayoutPage() {
  const router = useRouter();
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;

  usePrefetchWorkspace(WORKSPACE_SLUGS.CATEGORY_FORM);

  useEffect(() => {
    if (!adminKey) {
      router.replace("/categories");
    }
  }, [adminKey, router]);

  if (!adminKey) {
    return null;
  }

  return (
    <AppShell document>
      <FactorPageHeader
        title="Category form layout"
        subtitle="Edit sections and fields. Publish to sync validation with the category schema."
        builderMode
        onBuilderModeChange={() => {}}
        showBuilderToggle={false}
      />
      <EntityFormLayoutEditor
        workspaceSlug={WORKSPACE_SLUGS.CATEGORY_FORM}
        adminKey={adminKey}
      />
    </AppShell>
  );
}
