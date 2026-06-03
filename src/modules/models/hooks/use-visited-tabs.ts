"use client";

import { useEffect, useState } from "react";

/** Remember which tabs were opened so content stays mounted (avoids refetch on every switch). */
export function useVisitedTabs<T extends string>(activeId: T): Set<T> {
  const [visited, setVisited] = useState<Set<T>>(() => new Set([activeId]));

  useEffect(() => {
    setVisited((prev) => {
      if (prev.has(activeId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(activeId);
      return next;
    });
  }, [activeId]);

  return visited;
}
