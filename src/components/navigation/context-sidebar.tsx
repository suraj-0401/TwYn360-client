"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  PLATFORM_DOMAINS,
  getContextNavItems,
  type PlatformDomainId,
} from "@/config/navigation";
import { SidebarItem } from "./sidebar-item";

type ContextSidebarProps = {
  domainId: PlatformDomainId;
  collapsed: boolean;
};

function isItemActive(pathname: string, matchPrefix?: string): boolean {
  if (!matchPrefix) {
    return false;
  }
  if (matchPrefix === "/home") {
    return pathname === "/home";
  }
  return pathname === matchPrefix || pathname.startsWith(`${matchPrefix}/`);
}

export function ContextSidebar({ domainId, collapsed }: ContextSidebarProps) {
  const pathname = usePathname();
  const items = getContextNavItems(domainId);
  const domain = PLATFORM_DOMAINS.find((d) => d.id === domainId);

  if (collapsed) {
    return null;
  }

  return (
    <aside
      className={cn(
        "flex w-[220px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0c0c0e]",
      )}
      aria-label={`${domain?.label ?? "Module"} navigation`}
    >
      <div className="border-b border-white/[0.06] px-3 py-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[#52525b]">
          {domain?.label}
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {items.map((item) => (
          <SidebarItem
            key={item.id}
            label={item.label}
            icon={item.icon}
            href={item.href}
            status={item.status}
            badge={item.badge}
            active={isItemActive(pathname, item.matchPrefix)}
          />
        ))}
      </nav>
    </aside>
  );
}
