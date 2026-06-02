"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { QueryErrorState } from "@/components/feedback";
import { ClinicalModelCard } from "@/modules/clinical/components/clinical-model-card";
import { listModels } from "@/services/model.service";

export function ClinicalModelsList() {
  const query = useQuery({
    queryKey: ["clinical-models"],
    queryFn: async () =>
      (
        await listModels({
          page: 1,
          limit: 50,
        })
      ).data,
  });

  if (query.isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-zinc-500" aria-hidden />
      </div>
    );
  }

  if (query.error) {
    return (
      <QueryErrorState
        error={query.error}
        context={{ resource: "models" }}
        onRetry={() => query.refetch()}
        isRetrying={query.isRefetching}
      />
    );
  }

  const items = query.data?.items ?? [];

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">
        No models available yet.
      </p>
    );
  }

  if (items.length === 1) {
    const model = items[0]!;
    return (
      <ClinicalModelCard
        id={model.id}
        displayName={model.displayName}
        drugDisplayName={model.drug?.displayName}
        variant="featured"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((model) => (
        <ClinicalModelCard
          key={model.id}
          id={model.id}
          displayName={model.displayName}
          drugDisplayName={model.drug?.displayName}
          variant="compact"
        />
      ))}
    </div>
  );
}
