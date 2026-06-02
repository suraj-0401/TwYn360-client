"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebarPrefs } from "@/hooks/use-sidebar-prefs";
import {
  resolveActiveDomain,
  type PlatformDomainId,
} from "@/config/navigation";
import { AdminSessionGate } from "@/components/auth/admin-session-gate";
import { GlobalSidebar } from "@/components/navigation/global-sidebar";
import { ContextSidebar } from "@/components/navigation/context-sidebar";
import { PlatformTopbar } from "@/components/layout/platform-topbar";
import { WorkspaceContainer } from "@/components/layout/workspace-container";

export type PlatformShellProps = {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  contextLine?: React.ReactNode;
  topbarActions?: React.ReactNode;
  /** Override auto-detected domain */
  domainId?: PlatformDomainId;
  /** Pin list footer (pagination) inside viewport — registry tables */
  contentFill?: boolean;
};

export function PlatformShell({
  children,
  breadcrumbs,
  contextLine,
  topbarActions,
  domainId: domainIdProp,
  contentFill = false,
}: PlatformShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggleCollapsed, ready } = useSidebarPrefs();
  const detectedDomain = resolveActiveDomain(pathname);
  const [domainOverride, setDomainOverride] = useState<PlatformDomainId | null>(
    null,
  );

  const activeDomain = domainIdProp ?? domainOverride ?? detectedDomain;

  const handleSelectDomain = useCallback(
    (domainId: PlatformDomainId) => {
      setDomainOverride(domainId);
      const first =
        domainId === "platform"
          ? "/home"
          : domainId === "workspace"
            ? "/models"
            : "/factors";
      router.push(first);
    },
    [router],
  );

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b] text-sm text-[#71717a]">
        Loading…
      </div>
    );
  }

  return (
    <AdminSessionGate>
    <div className={cn("flex h-screen overflow-hidden bg-[#09090b] text-[#f4f4f5]")}>
      <GlobalSidebar
        activeDomain={activeDomain}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        onSelectDomain={handleSelectDomain}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <PlatformTopbar
            breadcrumbs={breadcrumbs}
            contextLine={contextLine}
            actions={topbarActions}
          />
        ) : null}
        <div className="flex min-h-0 min-w-0 flex-1">
          <ContextSidebar domainId={activeDomain} collapsed={collapsed} />
          <WorkspaceContainer className="min-w-0 flex-1" fill={contentFill}>
            {contentFill ? (
              <div className="flex min-h-0 flex-1 flex-col gap-4">{children}</div>
            ) : (
              children
            )}
          </WorkspaceContainer>
        </div>
      </div>
    </div>
    </AdminSessionGate>
  );
}
