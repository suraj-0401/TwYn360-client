"use client";

import type { ReactNode } from "react";

type ClinicalWorkspaceLayoutProps = {
  context: ReactNode;
  main: ReactNode;
  insights: ReactNode;
};

/** Three-column assess layout: context · intake · sticky outputs. */
export function ClinicalWorkspaceLayout({
  context,
  main,
  insights,
}: ClinicalWorkspaceLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 xl:grid xl:grid-cols-[220px_minmax(0,1fr)_300px] xl:items-start xl:gap-5">
      <div className="flex min-h-[min(100%,32rem)] flex-col xl:sticky xl:top-0 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
        {context}
      </div>
      <div className="min-w-0 space-y-4">{main}</div>
      <div className="min-w-0 xl:sticky xl:top-0 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto">
        {insights}
      </div>
    </div>
  );
}
