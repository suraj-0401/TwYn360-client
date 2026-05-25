"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";
import {
  LOOKUP_CONFIG_GROUPS,
  collectionDetailPath,
  type LookupConfigGroup,
} from "../constants/lookup-config-groups";
import { useLookupCollectionsOverview } from "../hooks/use-lookup-collections-overview";
import type { LookupCollectionOverview } from "@/types/lookup-overview";
import { collectionUsages } from "../utils/collection-usages";

function usagePills(collection: LookupCollectionOverview): string[] {
  const usages = collectionUsages(collection);
  if (usages.length === 0) {
    return [];
  }
  return [...new Set(usages.map((u) => u.label))].slice(0, 3);
}

export function LookupCollectionsHome() {
  const [search, setSearch] = useState("");
  const overviewQuery = useLookupCollectionsOverview();
  const items = overviewQuery.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return items;
    }
    return items.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.usageSummary ?? "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const byGroup = useMemo(() => {
    const map = new Map<string, LookupCollectionOverview[]>();
    for (const group of LOOKUP_CONFIG_GROUPS) {
      map.set(group.id, []);
    }
    for (const row of filtered) {
      const group = LOOKUP_CONFIG_GROUPS.find(
        (g) =>
          !g.comingSoon &&
          (g.categories as readonly string[]).includes(row.category),
      );
      if (group) {
        map.get(group.id)?.push(row);
      }
    }
    return map;
  }, [filtered]);

  return (
    <>
      <PageHeader
        title="Lookups"
        description="Open a collection to edit dropdown options."
      />

      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#52525b]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className={cn(platform.input, "pl-9")}
        />
      </div>

      <div className="space-y-6">
        {LOOKUP_CONFIG_GROUPS.map((group) => (
          <ConfigGroupSection
            key={group.id}
            group={group}
            collections={byGroup.get(group.id) ?? []}
          />
        ))}
      </div>
    </>
  );
}

function ConfigGroupSection({
  group,
  collections,
}: {
  group: LookupConfigGroup;
  collections: LookupCollectionOverview[];
}) {
  if (group.comingSoon) {
    return null;
  }

  if (collections.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-[#52525b]">
        {group.label}
      </h2>
      <ul className="overflow-hidden rounded-lg border border-white/[0.06] bg-[#0c0c0e]">
        {collections.map((collection, index) => (
          <CollectionRow
            key={collection.id}
            collection={collection}
            isLast={index === collections.length - 1}
          />
        ))}
      </ul>
    </section>
  );
}

function CollectionRow({
  collection,
  isLast,
}: {
  collection: LookupCollectionOverview;
  isLast: boolean;
}) {
  const pills = usagePills(collection);
  const unused = pills.length === 0;

  return (
    <li className={cn(!isLast && "border-b border-white/[0.04]")}>
      <Link
        href={collectionDetailPath(collection.code)}
        className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[#f4f4f5] group-hover:text-white">
            {collection.label}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {unused ? (
            <span className="text-[11px] text-[#3f3f46]">Unused</span>
          ) : (
            <span className="max-w-[140px] truncate text-[11px] text-[#71717a]">
              {pills.join(" · ")}
            </span>
          )}
          <span
            className="min-w-[2.5rem] rounded-md bg-white/[0.05] px-2 py-0.5 text-center text-[11px] tabular-nums text-[#a1a1aa]"
            title={`${collection.valueCount} values`}
          >
            {collection.valueCount}
          </span>
          <ChevronRight className="size-4 text-[#3f3f46] group-hover:text-[#71717a]" />
        </div>
      </Link>
    </li>
  );
}
