"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformPageShell } from "@/components/layout/platform-page-shell";
import { EntityFormLayoutEditor } from "@/modules/platform/components/entity-form-layout-editor";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { env } from "@/config/env";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";

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
    <PlatformPageShell
      domainId="registry"
      breadcrumbs={[
        { label: "Registry", href: "/categories" },
        { label: "Categories", href: "/categories" },
        { label: "Form layout" },
      ]}
      flush
      fill
    >
      <div className="shrink-0 px-4 pt-4 md:px-6">
        <PageHeader
          title="Category form layout"
          description="Edit sections and fields. Publish to sync validation with the category schema."
        />
      </div>
      <div className="min-h-0 flex-1">
        <EntityFormLayoutEditor
        workspaceSlug={WORKSPACE_SLUGS.CATEGORY_FORM}
        adminKey={adminKey}
        />
      </div>
    </PlatformPageShell>
  );
}
