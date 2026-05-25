import type { LookupCollection } from "@/services/lookup-collection.service";

export type LookupUsageKind = "workspace" | "entity" | "platform" | "api";

export type LookupUsageRef = {
  kind: LookupUsageKind;
  label: string;
  detail: string;
  path?: string;
  workspaceSlug?: string;
  entityTypeSlug?: string;
  fieldKey?: string;
};

export type LookupCollectionCategory =
  | "lifecycle"
  | "scientific"
  | "registry"
  | "custom"
  | "runtime";

export type LookupCollectionOverview = LookupCollection & {
  valueCount: number;
  usages: LookupUsageRef[];
  usageSummary: string;
};
