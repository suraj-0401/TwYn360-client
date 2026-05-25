"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BuilderModeToggle } from "@/components/layout/builder-mode-toggle";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformPageShell } from "@/components/layout/platform-page-shell";
import { FactorForm } from "@/modules/factors/components/factor-form";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { env } from "@/config/env";
import { toast } from "@/lib/toast";
import { createFactor } from "@/services/factor.service";
import type { FactorFormValues } from "@/modules/factors/components/factor-form";

export default function NewFactorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [builderMode, setBuilderMode] = useState(false);
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;

  usePrefetchWorkspace(WORKSPACE_SLUGS.FACTOR_REGISTRY);

  async function handleSubmit(payload: FactorFormValues) {
    await createFactor(payload);
    toast.success("Factor created");
    void queryClient.invalidateQueries({ queryKey: ["factors"] });
    router.push("/factors");
  }

  return (
    <PlatformPageShell
      domainId="registry"
      breadcrumbs={[
        { label: "Registry", href: "/factors" },
        { label: "Factors", href: "/factors" },
        { label: "New factor" },
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
        title="Create factor"
        description="Define and preview how this factor appears in your registry."
      />
      <FactorForm
        submitLabel="Create factor"
        onSubmit={handleSubmit}
        adminKey={adminKey}
        editable={builderMode}
      />
    </PlatformPageShell>
  );
}
