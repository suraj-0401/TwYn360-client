"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { FactorPageHeader } from "@/modules/factors/components/factor-page-header";
import { FactorSetForm } from "@/modules/factor-sets/components/factor-set-form";
import type { FactorSetFormValues } from "@/modules/factor-sets/components/factor-set-form";
import { FactorSetMembersSection } from "@/modules/factor-sets/components/factor-set-members-section";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { env } from "@/config/env";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    <AppShell document>
      <FactorPageHeader
        title="New factor set"
        subtitle="Define a reusable grouping of registry factors."
        builderMode={builderMode}
        onBuilderModeChange={setBuilderMode}
        showBuilderToggle={Boolean(adminKey)}
        actions={
          <Link
            href="/factor-sets"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-white/10 bg-transparent text-[#f4f4f5] hover:bg-white/5",
            )}
          >
            Cancel
          </Link>
        }
      />

      <div className="space-y-6">
        <FactorSetForm
          submitLabel="Create factor set"
          onSubmit={handleSubmit}
          adminKey={adminKey}
          editable={builderMode}
        />

        <FactorSetMembersSection
          mode="draft"
          members={pendingMembers}
          onMembersChange={setPendingMembers}
        />
      </div>
    </AppShell>
  );
}
