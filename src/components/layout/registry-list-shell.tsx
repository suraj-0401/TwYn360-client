"use client";

import type { ReactNode } from "react";
import { PlatformShell } from "@/components/layout/platform-shell";
import type { BreadcrumbItem } from "@/components/layout/platform-topbar";

type RegistryListShellProps = {
  children: ReactNode;
  breadcrumbs: BreadcrumbItem[];
  contextLine?: ReactNode;
  topbarActions?: ReactNode;
};

export function RegistryListShell({
  children,
  breadcrumbs,
  contextLine,
  topbarActions,
}: RegistryListShellProps) {
  return (
    <PlatformShell
      domainId="registry"
      contentFill
      breadcrumbs={breadcrumbs}
      contextLine={contextLine}
      topbarActions={topbarActions}
    >
      {children}
    </PlatformShell>
  );
}
