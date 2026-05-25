import type { LookupCollectionCategory } from "@/types/lookup-overview";

export type LookupConfigGroupId =
  | "scientific-workspace"
  | "registry"
  | "lifecycle"
  | "runtime";

export type LookupConfigGroup = {
  id: LookupConfigGroupId;
  label: string;
  description: string;
  categories: LookupCollectionCategory[];
  comingSoon?: boolean;
};

/** Level-1 configuration areas — groups DB lookup_types.category values. */
export const LOOKUP_CONFIG_GROUPS: LookupConfigGroup[] = [
  {
    id: "scientific-workspace",
    label: "Scientific workspace",
    description:
      "Framework and model configuration that shapes how scientific workspaces execute.",
    categories: ["scientific"],
  },
  {
    id: "registry",
    label: "Registry",
    description:
      "Dropdown options for factors, factor sets, categories, drugs, and custom workspace fields.",
    categories: ["registry", "custom"],
  },
  {
    id: "lifecycle",
    label: "Lifecycle",
    description:
      "Draft, active, archived, and deleted labels shared across registry entities and models.",
    categories: ["lifecycle"],
  },
  {
    id: "runtime",
    label: "Runtime",
    description: "Execution templates, formulas, and simulation metadata (coming soon).",
    categories: ["runtime"],
    comingSoon: true,
  },
];

export function collectionDetailPath(code: string): string {
  return `/lookups/${encodeURIComponent(code)}`;
}
