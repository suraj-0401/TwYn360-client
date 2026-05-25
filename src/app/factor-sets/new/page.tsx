"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BuilderModeToggle } from "@/components/layout/builder-mode-toggle";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformPageShell } from "@/components/layout/platform-page-shell";
import { FactorSetForm } from "@/modules/factor-sets/components/factor-set-form";
import type { FactorSetFormValues } from "@/modules/factor-sets/components/factor-set-form";
import { FactorSetMembersButton } from "@/modules/factor-sets/components/factor-set-members-button";
import { FactorSetMembersModal } from "@/modules/factor-sets/components/factor-set-members-modal";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { env } from "@/config/env";
import { toast } from "@/lib/toast";
import {
  createFactorSet,
  replaceFactorSetMembers,
} from "@/services/factor-set.service";
import type { FactorSummary } from "@/types/factor-set";

export default function NewFactorSetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [builderMode, setBuilderMode] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [pendingMembers, setPendingMembers] = useState<FactorSummary[]>([]);
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;

  usePrefetchWorkspace(WORKSPACE_SLUGS.FACTOR_SET_FORM);

  async function handleSubmit(payload: FactorSetFormValues) {
    const created = await createFactorSet(payload);

    if (pendingMembers.length > 0) {
      await replaceFactorSetMembers(created.data.id, {
        factorIds: pendingMembers.map((member) => member.id),
      });
    }

    toast.success("Factor set created");
    void queryClient.invalidateQueries({ queryKey: ["factor-sets"] });
    router.push(`/factor-sets/${created.data.id}/edit`);
  }

  return (
    <PlatformPageShell
      domainId="registry"
      breadcrumbs={[
        { label: "Registry", href: "/factor-sets" },
        { label: "Factor sets", href: "/factor-sets" },
        { label: "New factor set" },
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
        title="New factor set"
        description="Define a reusable grouping of registry factors."
        actions={
          !builderMode ? (
            <FactorSetMembersButton
              memberCount={pendingMembers.length}
              onClick={() => setMembersOpen(true)}
            />
          ) : null
        }
      />
      <FactorSetForm
        submitLabel="Create factor set"
        onSubmit={handleSubmit}
        adminKey={adminKey}
        editable={builderMode}
      />

      <FactorSetMembersModal
        open={membersOpen}
        onOpenChange={setMembersOpen}
        mode="draft"
        members={pendingMembers}
        onMembersChange={setPendingMembers}
      />
    </PlatformPageShell>
  );
}
