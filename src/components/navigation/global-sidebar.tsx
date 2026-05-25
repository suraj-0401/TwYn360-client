"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_DOMAINS, type PlatformDomainId } from "@/config/navigation";
import { Button } from "@/components/ui/button";

type GlobalSidebarProps = {
  activeDomain: PlatformDomainId;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectDomain: (domainId: PlatformDomainId) => void;
};

export function GlobalSidebar({
  activeDomain,
  collapsed,
  onToggleCollapsed,
  onSelectDomain,
}: GlobalSidebarProps) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-white/[0.06] bg-[#08080a] transition-[width] duration-200 ease-out",
        collapsed ? "w-[52px]" : "w-[52px]",
      )}
    >
      <div className="flex h-12 items-center justify-center border-b border-white/[0.06]">
        <Link
          href="/"
          className={cn(
            "flex size-8 items-center justify-center rounded-md text-xs font-bold tracking-tight text-[#f4f4f5]",
            "bg-gradient-to-br from-cyan-500/20 to-violet-500/20 ring-1 ring-white/10",
          )}
          title="DFF Platform"
        >
          DFF
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-1.5" aria-label="Platform domains">
        {PLATFORM_DOMAINS.map((domain) => {
          const Icon = domain.icon;
          const active = activeDomain === domain.id;
          const firstHref = domain.items.find((i) => i.href)?.href;

          if (!firstHref) {
            return (
              <span
                key={domain.id}
                title={`${domain.label} (coming soon)`}
                className="flex size-9 items-center justify-center rounded-md text-[#52525b]"
              >
                <Icon className="size-4" aria-hidden />
              </span>
            );
          }

          return (
            <Link
              key={domain.id}
              href={firstHref}
              title={domain.label}
              onClick={() => onSelectDomain(domain.id)}
              className={cn(
                "flex size-9 items-center justify-center rounded-md transition-colors",
                active
                  ? "bg-white/[0.1] text-[#f4f4f5]"
                  : "text-[#71717a] hover:bg-white/[0.04] hover:text-[#a1a1aa]",
              )}
            >
              <Icon className="size-4" aria-hidden />
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] p-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-9 w-full text-[#71717a] hover:bg-white/[0.04] hover:text-[#f4f4f5]"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebars" : "Collapse sidebars"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}