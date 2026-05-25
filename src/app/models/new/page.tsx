"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BuilderModeToggle } from "@/components/layout/builder-mode-toggle";
import { WorkspaceContent } from "@/components/layout/workspace-content";
import { WorkspaceContainer } from "@/components/layout/workspace-container";
import { PlatformPageShell } from "@/components/layout/platform-page-shell";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { env } from "@/config/env";
import { ModelForm } from "@/modules/models/components/model-form";
import { MODEL_WORKSPACE_FORM_ID } from "@/modules/models/components/model-workspace/constants";
import { toast } from "@/lib/toast";
import { createModel } from "@/services/model.service";
import type { CreateModelPayload } from "@/types/model";

function NewModelPageContent({
  builderMode,
  adminKey,
}: {
  builderMode: boolean;
  adminKey?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const initialDrugId = searchParams.get("drugId") ?? "";

  async function handleSubmit(payload: CreateModelPayload) {
    const created = await createModel(payload);
    toast.success("Model created");
    void queryClient.invalidateQueries({ queryKey: ["models"] });
    void queryClient.invalidateQueries({
      queryKey: ["drug-models", payload.drugId],
    });
    router.push(`/models/${created.data.id}/edit`);
  }

  return (
    <WorkspaceContainer flush fill className="h-full">
      <WorkspaceContent>
        <ModelForm
          mode="create"
          layout="workspace"
          formId={MODEL_WORKSPACE_FORM_ID}
          hideSubmitButton={builderMode}
          initialDrugId={initialDrugId}
          submitLabel="Create model"
          onSubmit={handleSubmit}
          adminKey={adminKey}
          editable={builderMode}
        />
      </WorkspaceContent>
    </WorkspaceContainer>
  );
}

export default function NewModelPage() {
  const [builderMode, setBuilderMode] = useState(false);
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;

  usePrefetchWorkspace(WORKSPACE_SLUGS.MODEL_FORM);

  return (
    <PlatformPageShell
      domainId="workspace"
      breadcrumbs={[
        { label: "Workspace", href: "/models" },
        { label: "Models", href: "/models" },
        { label: "New model" },
      ]}
      contextLine="Core header fields are platform-defined; custom scientific sections ship with the form builder."
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
      <Suspense
        fallback={<p className="text-sm text-[#71717a]">Loading create form…</p>}
      >
        <NewModelPageContent builderMode={builderMode} adminKey={adminKey} />
      </Suspense>
    </PlatformPageShell>
  );
}
