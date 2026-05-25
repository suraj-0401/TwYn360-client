"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { WorkspaceTabs } from "@/components/layout/workspace-tabs";
import { WorkspaceContent } from "@/components/layout/workspace-content";
import { QueryErrorState } from "@/components/feedback";
import { useLookupCollectionOverview } from "../hooks/use-lookup-collections-overview";
import { LookupCollectionValuesTab } from "./lookup-collection-values-tab";
import { LookupCollectionUsageTab } from "./lookup-collection-usage-tab";
import { LookupCollectionAuditTab } from "./lookup-collection-audit-tab";
import { LookupCollectionRulesTab } from "./lookup-collection-rules-tab";
import { LookupCollectionSettingsTab } from "./lookup-collection-settings-tab";

const COLLECTION_TABS = [
  { id: "values", label: "Values" },
  { id: "usage", label: "Usage" },
  { id: "settings", label: "Settings" },
  { id: "audit", label: "Audit", badge: "Soon" },
  { id: "rules", label: "Rules" },
] as const;

type CollectionTabId = (typeof COLLECTION_TABS)[number]["id"];

type LookupCollectionWorkspaceProps = {
  code: string;
  adminKey?: string;
};

export function LookupCollectionWorkspace({
  code,
  adminKey,
}: LookupCollectionWorkspaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CollectionTabId>("values");
  const overviewQuery = useLookupCollectionOverview(code);
  const overview = overviewQuery.data;

  useEffect(() => {
    if (
      overviewQuery.isFetched &&
      !overviewQuery.isLoading &&
      overviewQuery.data == null
    ) {
      router.replace("/lookups");
    }
  }, [
    overviewQuery.isFetched,
    overviewQuery.isLoading,
    overviewQuery.data,
    router,
  ]);

  if (overviewQuery.error) {
    return (
      <QueryErrorState
        error={overviewQuery.error}
        context={{ resource: "lookup collection" }}
        onRetry={() => overviewQuery.refetch()}
        isRetrying={overviewQuery.isFetching}
      />
    );
  }

  if (!overview && !overviewQuery.isLoading) {
    return (
      <div className="rounded-lg border border-white/[0.06] px-6 py-10 text-center">
        <p className="text-sm text-[#a1a1aa]">Collection not found</p>
        <Link
          href="/lookups"
          className="mt-3 inline-block text-sm text-cyan-400/90 hover:underline"
        >
          Back to configuration
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-white/[0.06] px-4 py-3 md:px-6">
        <Link
          href="/lookups"
          className="mb-2 inline-flex items-center gap-1 text-xs text-[#52525b] hover:text-[#a1a1aa]"
        >
          <ChevronLeft className="size-3.5" />
          All lookups
        </Link>
        {overview ? (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-lg font-semibold tracking-tight text-[#f4f4f5]">
              {overview.label}
            </h1>
            <span className="font-mono text-[11px] text-[#52525b]">
              {overview.code}
            </span>
            <span className="text-[11px] text-[#71717a]">
              {overview.valueCount} values
            </span>
          </div>
        ) : (
          <div className="h-8 animate-pulse rounded-md bg-white/[0.04]" />
        )}
      </div>

      <WorkspaceTabs
        tabs={[...COLLECTION_TABS]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as CollectionTabId)}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <WorkspaceContent>
          {overviewQuery.isLoading && !overview ? (
            <p className="text-sm text-[#71717a]">Loading collection…</p>
          ) : overview ? (
            <>
              {activeTab === "values" ? (
                <LookupCollectionValuesTab
                  overview={overview}
                  adminKey={adminKey}
                />
              ) : null}
              {activeTab === "usage" ? (
                <LookupCollectionUsageTab overview={overview} />
              ) : null}
              {activeTab === "audit" ? <LookupCollectionAuditTab /> : null}
              {activeTab === "rules" ? (
                <LookupCollectionRulesTab overview={overview} />
              ) : null}
              {activeTab === "settings" ? (
                <LookupCollectionSettingsTab
                  overview={overview}
                  adminKey={adminKey}
                  onViewUsages={() => setActiveTab("usage")}
                />
              ) : null}
            </>
          ) : null}
        </WorkspaceContent>
      </div>
    </div>
  );
}
