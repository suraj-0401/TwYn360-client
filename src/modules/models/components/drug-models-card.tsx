"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/data-table/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDrugModels } from "../hooks/use-drug-models";
import { useModelLookupLabels } from "../hooks/use-model-lookup-labels";

type DrugModelsCardProps = {
  drugId: string;
};

export function DrugModelsCard({ drugId }: DrugModelsCardProps) {
  const { data, isLoading, isError } = useDrugModels(drugId);
  const { frameworkLabel } = useModelLookupLabels();

  const modelsHref = `/models?drugId=${encodeURIComponent(drugId)}`;
  const newModelHref = `/models/new?drugId=${encodeURIComponent(drugId)}`;

  return (
    <Card className="rounded-[24px] border-white/[0.06] bg-[#111114] text-[#f4f4f5] shadow-none">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-lg font-semibold">Scientific models</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Link
            href={newModelHref}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "bg-[#f4f4f5] text-[#0a0a0a] hover:bg-white",
            )}
          >
            New model
          </Link>
          <Link
            href={modelsHref}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-white/10 bg-transparent text-[#f4f4f5] hover:bg-white/5",
            )}
          >
            All models
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full bg-white/10" />
            <Skeleton className="h-9 w-full bg-white/10" />
          </div>
        ) : null}

        {isError ? (
          <p className="text-sm text-[#f4f4f5]/60">
            Could not load models for this drug.
          </p>
        ) : null}

        {!isLoading && !isError && data?.length === 0 ? (
          <p className="text-sm text-[#f4f4f5]/60">
            No models yet for this drug. Create a workspace to attach factor
            sets.
          </p>
        ) : null}

        {!isLoading && !isError && data && data.length > 0 ? (
          <ul className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.06]">
            {data.map((model) => (
              <li key={model.id}>
                <Link
                  href={`/models/${model.id}/edit`}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
                >
                  <span className="min-w-0">
                    <span className="block font-medium">{model.displayName}</span>
                    <span className="text-xs text-[#f4f4f5]/50">
                      {model.factorSetCount} factor set
                      {model.factorSetCount === 1 ? "" : "s"}
                      {model.frameworkType
                        ? ` · ${frameworkLabel(model.frameworkType)}`
                        : ""}
                    </span>
                  </span>
                  <StatusBadge
                    status={model.statusCode}
                    className="shrink-0"
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
