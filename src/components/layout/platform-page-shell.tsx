"use client";

import type { ReactNode } from "react";
import { PlatformShell } from "@/components/layout/platform-shell";
import type { BreadcrumbItem } from "@/components/layout/platform-topbar";
import { WorkspaceContainer } from "@/components/layout/workspace-container";
import { WorkspaceContent } from "@/components/layout/workspace-content";
import type { PlatformDomainId } from "@/config/navigation";

type PlatformPageShellProps = {
  children: ReactNode;
  domainId: PlatformDomainId;
  breadcrumbs: BreadcrumbItem[];
  contextLine?: ReactNode;
  topbarActions?: ReactNode;
  /** Full-bleed main column (workspace editors) */
  flush?: boolean;
  fill?: boolean;
};

/**
 * Standard platform chrome: global sidebar + context sidebar + full-width main.
 * Use instead of DocumentShell for all in-app routes.
 */
export function PlatformPageShell({
  children,
  domainId,
  breadcrumbs,
  contextLine,
  topbarActions,
  flush = false,
  fill = false,
}: PlatformPageShellProps) {
  return (
    <PlatformShell
      domainId={domainId}
      breadcrumbs={breadcrumbs}
      contextLine={contextLine}
      topbarActions={topbarActions}
    >
      <WorkspaceContainer flush={flush} fill={fill} className="w-full">
        <WorkspaceContent
          className={
            flush
              ? "flex min-h-0 flex-1 flex-col px-0 py-0"
              : undefined
          }
        >
          {children}
        </WorkspaceContent>
      </WorkspaceContainer>
    </PlatformShell>
  );
}
