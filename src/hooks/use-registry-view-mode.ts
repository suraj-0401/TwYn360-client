"use client";

import { useSearchParams } from "next/navigation";

/** True when opened from a list “View” action (`?view=1`). */
export function useRegistryViewMode(): boolean {
  const searchParams = useSearchParams();
  return searchParams.get("view") === "1";
}
