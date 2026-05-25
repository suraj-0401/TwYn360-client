"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "dff-platform-sidebar-collapsed";

export function useSidebarPrefs() {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") {
        setCollapsed(true);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { collapsed, toggleCollapsed, ready };
}
