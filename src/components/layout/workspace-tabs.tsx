"use client";

import { cn } from "@/lib/utils";

export type WorkspaceTabItem = {
  id: string;
  label: string;
  badge?: string;
  disabled?: boolean;
};

type WorkspaceTabsProps = {
  tabs: WorkspaceTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
};

export function WorkspaceTabs({
  tabs,
  activeId,
  onChange,
  className,
}: WorkspaceTabsProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 gap-0.5 overflow-x-auto border-b border-white/[0.06] bg-[#0c0c0e] px-2",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        const disabled = tab.disabled ?? false;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 text-sm transition-colors",
              disabled && "cursor-not-allowed opacity-50",
              active
                ? "text-[#f4f4f5] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-cyan-400/80"
                : "text-[#71717a] hover:text-[#a1a1aa]",
            )}
          >
            {tab.label}
            {tab.badge ? (
              <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#52525b]">
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
