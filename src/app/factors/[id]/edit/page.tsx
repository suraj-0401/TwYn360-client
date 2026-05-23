"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import {
  GovernanceCardSkeleton,
  QueryErrorState,
} from "@/components/feedback";
import { DynamicFormSkeleton } from "@/renderer/components/dynamic-form-skeleton";
import { FactorFactorSetsCard } from "@/modules/factors/components/factor-factor-sets-card";
import { FactorDangerZone } from "@/modules/factors/components/factor-danger-zone";
import { FactorGovernanceCard } from "@/modules/factors/components/factor-governance-card";
import { FactorForm } from "@/modules/factors/components/factor-form";
import { FactorPageHeader } from "@/modules/factors/components/factor-page-header";
import { buttonVariants } from "@/components/ui/button";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { cn } from "@/lib/utils";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { env } from "@/config/env";
import { toast } from "@/lib/toast";
import { getFactor, updateFactor } from "@/services/factor.service";
import type { FactorFormValues } from "@/modules/factors/components/factor-form";

type EditFactorPageProps = {
  params: Promise<{ id: string }>;
};

export default function EditFactorPage({ params }: EditFactorPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [builderMode, setBuilderMode] = useState(false);
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;

  usePrefetchWorkspace(WORKSPACE_SLUGS.FACTOR_REGISTRY);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["factor", id],
    queryFn: async () => {
      const response = await getFactor(id);
      return response.data;
    },
    staleTime: 60_000,
  });

  async function handleSubmit(payload: FactorFormValues) {
    await updateFactor(id, payload);
    toast.success("Changes saved");
    void queryClient.invalidateQueries({ queryKey: ["factors"] });
    void queryClient.invalidateQueries({ queryKey: ["factor", id] });
    router.push("/factors");
  }

  const showFactorSkeleton = isLoading && !data;

  return (
    <AppShell document>
      <FactorPageHeader
        title="Edit factor"
        builderMode={builderMode}
        onBuilderModeChange={setBuilderMode}
        showBuilderToggle={Boolean(adminKey)}
        actions={
          <Link
            href={`/factors/${id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-white/10 bg-transparent text-[#f4f4f5] hover:bg-white/5",
            )}
          >
            View
          </Link>
        }
      />

      {error ? (
        <QueryErrorState
          error={error}
          context={{ resource: "this factor" }}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      ) : null}

      {showFactorSkeleton ? (
        <div className="space-y-8">
          <GovernanceCardSkeleton />
          <DynamicFormSkeleton />
        </div>
      ) : null}

      {data && !error ? (
        <div className="space-y-8">
          {!builderMode ? <FactorGovernanceCard factor={data} /> : null}
          {!builderMode ? <FactorFactorSetsCard factorId={id} /> : null}

          <FactorForm
            initial={data}
            submitLabel="Save changes"
            onSubmit={handleSubmit}
            adminKey={adminKey}
            editable={builderMode}
          />

          {!builderMode ? <FactorDangerZone factor={data} /> : null}
        </div>
      ) : null}
    </AppShell>
  );
}
