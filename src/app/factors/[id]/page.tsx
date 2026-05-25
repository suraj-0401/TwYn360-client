"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformPageShell } from "@/components/layout/platform-page-shell";
import {
  GovernanceCardSkeleton,
  QueryErrorState,
} from "@/components/feedback";
import { DynamicFormSkeleton } from "@/renderer/components/dynamic-form-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { FactorForm } from "@/modules/factors/components/factor-form";
import { FactorFactorSetsCard } from "@/modules/factors/components/factor-factor-sets-card";
import { FactorGovernanceCard } from "@/modules/factors/components/factor-governance-card";
import { WORKSPACE_SLUGS } from "@/config/workspace";
import { usePrefetchWorkspace } from "@/renderer/hooks/use-prefetch-workspace";
import { cn } from "@/lib/utils";
import { getFactor } from "@/services/factor.service";

type ViewFactorPageProps = {
  params: Promise<{ id: string }>;
};

export default function ViewFactorPage({ params }: ViewFactorPageProps) {
  const { id } = use(params);

  usePrefetchWorkspace(WORKSPACE_SLUGS.FACTOR_REGISTRY);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["factor", id],
    queryFn: async () => (await getFactor(id)).data,
    staleTime: 60_000,
  });

  const showSkeleton = isLoading && !data;

  return (
    <PlatformPageShell
      domainId="registry"
      breadcrumbs={[
        { label: "Registry", href: "/factors" },
        { label: "Factors", href: "/factors" },
        { label: data?.displayName ?? "Factor" },
      ]}
      topbarActions={
        <Link
          href={`/factors/${id}/edit`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04]",
          )}
        >
          Edit
        </Link>
      }
    >
      <PageHeader
        title={data?.displayName ?? "View factor"}
        description="Read-only preview from the factor workspace definition."
      />

      {error ? (
        <QueryErrorState
          error={error}
          context={{ resource: "this factor" }}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
        />
      ) : null}

      {showSkeleton ? (
        <div className="space-y-8">
          <GovernanceCardSkeleton />
          <DynamicFormSkeleton />
        </div>
      ) : null}

      {data && !error ? (
        <div className="w-full space-y-8">
          <FactorGovernanceCard factor={data} />
          <FactorFactorSetsCard factorId={id} />
          <FactorForm initial={data} readOnly onSubmit={async () => {}} submitLabel="" />
        </div>
      ) : null}
    </PlatformPageShell>
  );
}
