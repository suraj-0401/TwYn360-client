"use client";

import { useQuery } from "@tanstack/react-query";
import { ENTITY_TYPE, LIFECYCLE_STATUS } from "@/config/platform";
import { listEntityRecords } from "@/services/entity-record.service";

export type DrugOption = {
  value: string;
  label: string;
};

export function useDrugOptions() {
  return useQuery({
    queryKey: ["drug-options"],
    queryFn: async () => {
      const response = await listEntityRecords(ENTITY_TYPE.DRUG, {
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
      })) satisfies DrugOption[];
    },
    staleTime: 60_000,
  });
}
