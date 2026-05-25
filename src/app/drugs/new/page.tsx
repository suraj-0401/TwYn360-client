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

export default function NewDrugPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [builderMode, setBuilderMode] = useState(false);
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;

  usePrefetchWorkspace(WORKSPACE_SLUGS.DRUG_FORM);

  async function handleSubmit(payload: Record<string, unknown>) {
    await createEntityRecord(ENTITY_TYPE.DRUG, payload);
    toast.success("Drug created");
    void queryClient.invalidateQueries({ queryKey: ["drugs"] });
    router.push("/drugs");
  }

  return (
    <PlatformPageShell
      domainId="registry"
      breadcrumbs={[
        { label: "Registry", href: "/drugs" },
        { label: "Drugs", href: "/drugs" },
        { label: "New drug" },
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
        title="New drug"
        description="Add a drug program under a category."
      />
      <EntityRecordForm
        workspaceSlug={WORKSPACE_SLUGS.DRUG_FORM}
        submitLabel="Create drug"
        onSubmit={handleSubmit}
        showCategoryPicker={!builderMode}
        adminKey={adminKey}
        editable={builderMode}
      />
    </PlatformPageShell>
  );
}
