"use client";

import { PlatformShell } from "@/components/layout/platform-shell";
import { env } from "@/config/env";
import { LookupCollectionWorkspace } from "./lookup-collection-workspace";
import { useLookupCollectionOverview } from "../hooks/use-lookup-collections-overview";

type LookupCollectionPageContentProps = {
  code: string;
};

export function LookupCollectionPageContent({
  code,
}: LookupCollectionPageContentProps) {
  const adminKey = env.NEXT_PUBLIC_ADMIN_API_KEY;
  const overviewQuery = useLookupCollectionOverview(code);
  const label = overviewQuery.data?.label ?? code;

  return (
    <PlatformShell
      domainId="registry"
      breadcrumbs={[
        { label: "Registry", href: "/factors" },
        { label: "Lookups", href: "/lookups" },
        { label },
      ]}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <LookupCollectionWorkspace code={code} adminKey={adminKey} />
      </div>
    </PlatformShell>
  );
}
