"use client";

import { RegistryListShell } from "@/components/layout/registry-list-shell";
import { QueryErrorState } from "@/components/feedback";
import { LookupCollectionsHome } from "./lookup-collections-home";
import { useLookupCollectionsOverview } from "../hooks/use-lookup-collections-overview";

export function LookupsPageContent() {
  const overviewQuery = useLookupCollectionsOverview();

  return (
    <RegistryListShell
      breadcrumbs={[
        { label: "Registry", href: "/factors" },
        { label: "Lookups" },
      ]}
    >
      {overviewQuery.error ? (
        <QueryErrorState
          error={overviewQuery.error}
          context={{ resource: "lookup collections" }}
          onRetry={() => overviewQuery.refetch()}
          isRetrying={overviewQuery.isFetching}
        />
      ) : null}

      <LookupCollectionsHome />
    </RegistryListShell>
  );
}
