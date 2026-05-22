"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { AppShell } from "@/components/layout/app-shell";
import { FactorForm } from "@/modules/factors/components/factor-form";
import { FactorPageHeader } from "@/modules/factors/components/factor-page-header";
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
    <AppShell document>
      <FactorPageHeader
        title="Create factor"
        builderMode={builderMode}
        onBuilderModeChange={setBuilderMode}
        showBuilderToggle={Boolean(adminKey)}
      />

      <FactorForm
        submitLabel="Create factor"
        onSubmit={handleSubmit}
        adminKey={adminKey}
        editable={builderMode}
      />
    </AppShell>
  );
}
