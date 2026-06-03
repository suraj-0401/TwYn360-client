"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ModelWorkspaceTabPanelProps = {
  tabId: string;
  activeId: string;
  visited: Set<string>;
  children: ReactNode;
  className?: string;
};

export function ModelWorkspaceTabPanel({
  tabId,
  activeId,
  visited,
  children,
  className,
}: ModelWorkspaceTabPanelProps) {
  if (!visited.has(tabId)) {
    return null;
  }

  const isActive = activeId === tabId;

  return (
    <div
      className={cn(!isActive && "hidden", className)}
      aria-hidden={!isActive}
      hidden={!isActive}
    >
      {children}
    </div>
  );
}
