"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  CLINICAL_NAV_ITEMS,
  CLINICAL_PORTAL,
} from "@/config/navigation/clinical-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PLATFORM_PERSONA } from "@/config/persona";
import { readSession } from "@/lib/auth-session";

type ClinicalShellProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  hideHeader?: boolean;
};

function isActive(pathname: string, matchPrefix: string): boolean {
  if (matchPrefix === "/clinical") {
    return pathname === "/clinical";
  }
  return pathname === matchPrefix || pathname.startsWith(`${matchPrefix}/`);
}

function userInitials(email: string | undefined): string {
  if (!email) {
    return "?";
  }
  const part = email.split("@")[0]?.trim() ?? "";
  if (part.length >= 2) {
    return part.slice(0, 2).toUpperCase();
  }
  return part.slice(0, 1).toUpperCase() || "?";
}

export function ClinicalShell({
  children,
  title,
  description,
  hideHeader = false,
}: ClinicalShellProps) {
  const pathname = usePathname();
  const PortalIcon = CLINICAL_PORTAL.icon;
  const session = readSession();

  return (
    <div className="flex h-screen overflow-hidden bg-[#06070a] text-zinc-100">
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-white/[0.06] bg-[#08090c]">
        <div className="px-4 py-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
              <PortalIcon className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-zinc-100">
                {CLINICAL_PORTAL.title}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label="Clinical">
          {CLINICAL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.id === "home"
                ? pathname === "/clinical"
                : isActive(pathname, item.matchPrefix);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
                  active
                    ? "bg-white/[0.06] font-medium text-zinc-100"
                    : "text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300",
                )}
              >
                <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          {session ? (
            <div className="mb-2 flex items-center gap-2 rounded-lg px-2 py-1.5">
              <span className="flex size-7 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-medium text-zinc-400">
                {userInitials(session.email)}
              </span>
              <span className="min-w-0 truncate text-[11px] text-zinc-500">
                {session.email}
              </span>
            </div>
          ) : null}
          <SignOutButton
            persona={PLATFORM_PERSONA.DOCTOR}
            className="w-full justify-start text-[12px] text-zinc-500 hover:text-zinc-300"
          />
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.08),transparent)]"
          aria-hidden
        />

        {!hideHeader && title ? (
          <header className="relative border-b border-white/[0.06] px-6 py-4">
            <h1 className="text-lg font-semibold">{title}</h1>
            {description ? (
              <p className="mt-1 text-sm text-zinc-400">{description}</p>
            ) : null}
          </header>
        ) : null}

        <main
          className={cn(
            "relative min-h-0 flex-1 overflow-auto",
            hideHeader ? "px-5 py-6 lg:px-8 lg:py-8" : "p-6",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
