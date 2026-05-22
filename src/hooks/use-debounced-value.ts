"use client";

import { useEffect, useState } from "react";

/** Default delay for API search inputs (ms). */
export const SEARCH_DEBOUNCE_MS = 400;

/**
 * Returns a value that updates after `delay` ms of no changes to `value`.
 * Use for search inputs: bind the input to `value`, pass `debounced` to React Query keys.
 */
export function useDebouncedValue<T>(value: T, delay = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
