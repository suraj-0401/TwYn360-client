"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformPageShell } from "@/components/layout/platform-page-shell";
import { EntityFormLayoutEditor } from "@/modules/platform/components/entity-form-layout-editor";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { env } from "@/config/env";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";

export default function ModelFormLayoutPage() {
  const router = useRouter();
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;

  usePrefetchWorkspace(WORKSPACE_SLUGS.MODEL_FORM);

  useEffect(() => {
    if (!adminKey) {
      router.replace("/models");
    }
  }, [adminKey, router]);

  if (!adminKey) {
    return null;
  }

  return (
    <PlatformPageShell
      domainId="workspace"
      breadcrumbs={[
        { label: "Workspace", href: "/models" },
        { label: "Models", href: "/models" },
        { label: "Form layout" },
      ]}
      flush
      fill
    >
      <div className="shrink-0 px-4 pt-4 md:px-6">
        <PageHeader
          title="Model form layout"
          description="Add custom scientific sections. Header fields (drug, status, framework) stay code-defined."
        />
      </div>
      <div className="min-h-0 flex-1">
        <EntityFormLayoutEditor
          workspaceSlug={WORKSPACE_SLUGS.MODEL_FORM}
          adminKey={adminKey}
        />
      </div>
    </PlatformPageShell>
  );
}
