"use client";

import type { ReactNode } from "react";
import { BuilderModeToggle } from "@/components/layout/builder-mode-toggle";

type FactorPageHeaderProps = {
  title: string;
  subtitle?: string;
  builderMode: boolean;
  onBuilderModeChange: (enabled: boolean) => void;
  showBuilderToggle?: boolean;
  actions?: ReactNode;
};

export function FactorPageHeader({
  title,
  subtitle = "Define and preview how this factor appears in your registry.",
  builderMode,
  onBuilderModeChange,
  showBuilderToggle = false,
  actions,
}: FactorPageHeaderProps) {
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-5 border-b border-white/[0.04] bg-[#0a0a0a]/80 px-4 py-3 backdrop-blur-sm sm:-mx-0 sm:px-0">
      <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-sans text-[15px] font-semibold tracking-tight text-[#f5f5f5]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 max-w-lg font-sans text-[12px] leading-snug text-[#71717a]">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {showBuilderToggle ? (
            <BuilderModeToggle
              enabled={builderMode}
              onChange={onBuilderModeChange}
              variant="document"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
