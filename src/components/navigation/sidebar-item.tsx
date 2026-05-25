"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItemStatus } from "@/config/navigation";

type SidebarItemProps = {
  label: string;
  icon: LucideIcon;
  href?: string;
  status: NavItemStatus;
  badge?: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
};

export function SidebarItem({
  label,
  icon: Icon,
  href,
  status,
  badge,
  active = false,
  collapsed = false,
  onClick,
}: SidebarItemProps) {
  const disabled = status !== "active" || !href;

  const className = cn(
    "group flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
    active
      ? "bg-white/[0.08] text-[#f4f4f5]"
      : "text-[#a1a1aa] hover:bg-white/[0.04] hover:text-[#f4f4f5]",
    disabled && "cursor-default opacity-50 hover:bg-transparent hover:text-[#a1a1aa]",
  );

  const content = (
    <>
      <Icon className="size-4 shrink-0" aria-hidden />
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate text-left">{label}</span>
          {badge ? (
            <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#71717a]">
              {badge}
            </span>
          ) : null}
        </>
      ) : null}
    </>
  );

  if (disabled || !href) {
    return (
      <span className={className} title={collapsed ? label : undefined}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      title={collapsed ? label : undefined}
      onClick={onClick}
    >
      {content}
    </Link>
  );
}
