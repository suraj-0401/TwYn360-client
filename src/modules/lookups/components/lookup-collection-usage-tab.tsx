"use client";

import Link from "next/link";
import type { LookupCollectionOverview } from "@/types/lookup-overview";
import { collectionUsages } from "../utils/collection-usages";

type LookupCollectionUsageTabProps = {
  overview: LookupCollectionOverview;
};

export function LookupCollectionUsageTab({
  overview,
}: LookupCollectionUsageTabProps) {
  const usages = collectionUsages(overview);

  if (usages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/[0.08] px-6 py-10 text-center text-sm text-[#71717a]">
        Not used anywhere yet
      </div>
    );
  }

  const workspace = usages.filter((u) => u.kind === "workspace");
  const entity = usages.filter((u) => u.kind === "entity");
  const platform = usages.filter(
    (u) => u.kind === "platform" || u.kind === "api",
  );

  return (
    <div className="space-y-5">
      {platform.length > 0 ? (
        <UsageSection title="Platform" items={platform} />
      ) : null}
      {workspace.length > 0 ? (
        <UsageSection title="Workspaces" items={workspace} />
      ) : null}
      {entity.length > 0 ? (
        <UsageSection title="Entity records" items={entity} />
      ) : null}
    </div>
  );
}

function UsageSection({
  title,
  items,
}: {
  title: string;
  items: LookupCollectionOverview["usages"];
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-[#52525b]">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((usage, index) => (
          <li
            key={`${usage.label}-${index}`}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              {usage.path ? (
                <Link
                  href={usage.path}
                  className="font-medium text-[#f4f4f5] hover:underline"
                >
                  {usage.label}
                </Link>
              ) : (
                <span className="font-medium text-[#f4f4f5]">
                  {usage.label}
                </span>
              )}
              {usage.workspaceSlug ? (
                <span className="font-mono text-[10px] text-[#52525b]">
                  {usage.workspaceSlug}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-[#71717a]">{usage.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
