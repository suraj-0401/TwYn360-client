"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PlatformTopbarProps = {
  breadcrumbs: BreadcrumbItem[];
  /** Secondary context line (drug, status, counts) */
  contextLine?: ReactNode;
  actions?: ReactNode;
};

export function PlatformTopbar({
  breadcrumbs,
  contextLine,
  actions,
}: PlatformTopbarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-[#0a0a0b]/80 px-4 backdrop-blur-sm">
      <div className="min-w-0">
        <nav
          className="flex flex-wrap items-center gap-1 text-sm"
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight
                  className="size-3.5 shrink-0 text-[#52525b]"
                  aria-hidden
                />
              ) : null}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="truncate text-[#a1a1aa] transition-colors hover:text-[#f4f4f5]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate font-medium text-[#f4f4f5]">
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
        {contextLine ? (
          <p className="mt-0.5 truncate text-xs text-[#71717a]">{contextLine}</p>
        ) : null}
      </div>
      {actions ? (
        <div className={cn("flex shrink-0 items-center gap-2")}>{actions}</div>
      ) : null}
    </header>
  );
}
