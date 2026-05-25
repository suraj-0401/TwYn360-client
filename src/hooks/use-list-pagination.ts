"use client";

import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { DEFAULT_LIST_LIMIT } from "@/platform/pagination";

export function useListPagination(limit = DEFAULT_LIST_LIMIT) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch.trim() || undefined,
    }),
    [page, limit, debouncedSearch],
  );

  function onSearchChange(value: string) {
    setPage(1);
    setSearchInput(value);
  }

  return {
    page,
    setPage,
    searchInput,
    debouncedSearch,
    onSearchChange,
    limit,
    queryParams,
  };
}
