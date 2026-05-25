"use client";

import type { LookupCollectionOverview } from "@/types/lookup-overview";

type LookupCollectionRulesTabProps = {
  overview: LookupCollectionOverview;
};

export function LookupCollectionRulesTab({
  overview,
}: LookupCollectionRulesTabProps) {
  const isLifecycle = overview.category === "lifecycle";
  const isScientific = overview.category === "scientific";

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-4">
        <p className="text-sm font-medium text-[#f4f4f5]">Collection rules</p>
        <ul className="mt-3 space-y-2 text-sm text-[#a1a1aa]">
          <li>
            <span className="text-[#71717a]">System collection:</span>{" "}
            {overview.isSystem ? "Yes" : "No"}
          </li>
          <li>
            <span className="text-[#71717a]">Active values:</span>{" "}
            {overview.valueCount}
          </li>
        </ul>
      </div>

      {isLifecycle ? (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-4 text-sm text-amber-200/90">
          <p className="font-medium">Lifecycle-managed</p>
          <p className="mt-1 text-xs text-amber-200/70">
            Codes draft, active, archived, and deleted are required by the
            platform. You may edit labels; removing codes is blocked.
          </p>
        </div>
      ) : null}

      {isScientific ? (
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-4 text-sm text-sky-200/90">
          <p className="font-medium">Org-expandable</p>
          <p className="mt-1 text-xs text-sky-200/70">
            New framework types can be added here. Values are validated when
            assigned on scientific models.
          </p>
        </div>
      ) : null}

      <p className="text-xs text-[#52525b]">
        Advanced validation rules and protected-value policies will be
        configurable in a future release.
      </p>
    </div>
  );
}
