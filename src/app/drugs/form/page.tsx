"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { EntityFormLayoutEditor } from "@/modules/platform/components/entity-form-layout-editor";
import { FactorPageHeader } from "@/modules/factors/components/factor-page-header";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { env } from "@/config/env";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";

export default function DrugFormLayoutPage() {
  const router = useRouter();
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;

  usePrefetchWorkspace(WORKSPACE_SLUGS.DRUG_FORM);

  useEffect(() => {
    if (!adminKey) {
      router.replace("/drugs");
    }
  }, [adminKey, router]);

  if (!adminKey) {
    return null;
  }

  return (
    <AppShell document>
      <FactorPageHeader
        title="Drug form layout"
        subtitle="Edit sections and fields. Publish to sync validation with the drug schema."
        builderMode
        onBuilderModeChange={() => {}}
        showBuilderToggle={false}
      />
      <EntityFormLayoutEditor
        workspaceSlug={WORKSPACE_SLUGS.DRUG_FORM}
        adminKey={adminKey}
      />
    </AppShell>
  );
}
