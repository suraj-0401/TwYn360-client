"use client";

import { useQuery } from "@tanstack/react-query";
import { ENTITY_TYPE, LIFECYCLE_STATUS } from "@/config/platform";
import { listEntityRecords } from "@/services/entity-record.service";

export type CategoryOption = {
  value: string;
  label: string;
};

export function useCategoryOptions() {
  return useQuery({
    queryKey: ["category-options"],
    queryFn: async () => {
      const response = await listEntityRecords(ENTITY_TYPE.CATEGORY, {
        limit: 100,
        statusCode: LIFECYCLE_STATUS.ACTIVE,
      });
      return response.data.items.map((row) => ({
        value: row.id,
        label:
          (typeof row.values.name === "string" && row.values.name) ||
          row.displayName ||
          row.slug ||
          row.id,
      })) satisfies CategoryOption[];
    },
    staleTime: 60_000,
  });
}

export function useCategoryLabelMap() {
  const query = useCategoryOptions();
  const map = new Map<string, string>();
  for (const opt of query.data ?? []) {
    map.set(opt.value, opt.label);
  }
  return { map, isLoading: query.isLoading, error: query.error };
}
