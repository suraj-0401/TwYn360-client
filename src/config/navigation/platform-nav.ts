/**
 * Single source of truth for Platform Shell navigation (P0).
 * Role-aware variants (super-admin, org-admin, user) come later when auth exists.
 */

import type { LucideIcon } from "lucide-react";
import {
  Beaker,
  Boxes,
  FlaskConical,
  Home,
  Layers,
  LayoutGrid,
  ListTree,
  Pill,
  PlayCircle,
  Shapes,
  Workflow,
} from "lucide-react";

export type PlatformDomainId = "platform" | "registry" | "workspace" | "runtime";

export type NavItemStatus = "active" | "disabled" | "coming_soon";

export type PlatformNavItem = {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
  status: NavItemStatus;
  /** Shown for coming_soon / disabled items */
  badge?: string;
  /** Match pathname prefix for active state */
  matchPrefix?: string;
};

export type PlatformDomain = {
  id: PlatformDomainId;
  label: string;
  icon: LucideIcon;
  /** Context sidebar items when this domain is selected */
  items: PlatformNavItem[];
};

/** Level 1 — global sidebar domains */
export const PLATFORM_DOMAINS: PlatformDomain[] = [
  {
    id: "platform",
    label: "Platform",
    icon: Home,
    items: [
      {
        id: "home",
        label: "Control center",
        href: "/home",
        icon: Home,
        status: "active",
        matchPrefix: "/home",
      },
    ],
  },
  {
    id: "registry",
    label: "Registry",
    icon: Layers,
    items: [
      {
        id: "factors",
        label: "Factors",
        href: "/factors",
        icon: FlaskConical,
        status: "active",
        matchPrefix: "/factors",
      },
      {
        id: "factor-sets",
        label: "Factor sets",
        href: "/factor-sets",
        icon: Boxes,
        status: "active",
        matchPrefix: "/factor-sets",
      },
      {
        id: "categories",
        label: "Categories",
        href: "/categories",
        icon: Shapes,
        status: "active",
        matchPrefix: "/categories",
      },
      {
        id: "drugs",
        label: "Drugs",
        href: "/drugs",
        icon: Pill,
        status: "active",
        matchPrefix: "/drugs",
      },
      {
        id: "lookups",
        label: "Lookups",
        href: "/lookups",
        icon: ListTree,
        status: "active",
        matchPrefix: "/lookups",
      },
      {
        id: "templates",
        label: "Templates",
        icon: LayoutGrid,
        status: "coming_soon",
        badge: "P5",
      },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    icon: Beaker,
    items: [
      {
        id: "models",
        label: "Models",
        href: "/models",
        icon: Beaker,
        status: "active",
        matchPrefix: "/models",
      },
      {
        id: "simulations",
        label: "Simulations",
        icon: PlayCircle,
        status: "coming_soon",
        badge: "P8",
      },
      {
        id: "reports",
        label: "Reports",
        icon: LayoutGrid,
        status: "coming_soon",
        badge: "Later",
      },
    ],
  },
  {
    id: "runtime",
    label: "Runtime",
    icon: Workflow,
    items: [
      {
        id: "workflows",
        label: "Workflow engine",
        icon: Workflow,
        status: "coming_soon",
        badge: "P8",
      },
      {
        id: "execution",
        label: "Execution queue",
        icon: PlayCircle,
        status: "coming_soon",
        badge: "P8",
      },
      {
        id: "outputs",
        label: "Outputs",
        icon: Boxes,
        status: "coming_soon",
        badge: "P8",
      },
    ],
  },
];

export type ShellMode = "platform" | "document";

/**
 * Routes that use Document Shell (focused editor / builder).
 * All other app routes default to Platform Shell after P1 migration.
 */
export const DOCUMENT_SHELL_ROUTE_PREFIXES = [
  "/factors/new",
  "/factors/", // edit uses document; list uses platform (handled by rules below)
  "/factor-sets/new",
  "/factor-sets/",
  "/categories/new",
  "/categories/form",
  "/categories/",
  "/drugs/new",
  "/drugs/form",
  "/drugs/",
  "/models/new",
] as const;

/** Path patterns that stay on Platform Shell even under a prefix. */
export const PLATFORM_SHELL_OVERRIDES = [
  "/factors",
  "/factor-sets",
  "/categories",
  "/drugs",
  "/models",
  "/lookups",
] as const;

/** Registry/workspace edits use Platform layout (P4/P3), not Document Shell. */
export const PLATFORM_WORKSPACE_ROUTE_PATTERNS = [
  /^\/models\/[^/]+\/edit$/,
  /^\/factor-sets\/[^/]+\/edit$/,
  /^\/drugs\/[^/]+\/edit$/,
  /^\/categories\/[^/]+\/edit$/,
] as const;

/**
 * Resolve shell mode from pathname (P0 contract for P1 implementation).
 */
export function resolveShellMode(pathname: string): ShellMode {
  const normalized = pathname.replace(/\/$/, "") || "/";

  for (const pattern of PLATFORM_WORKSPACE_ROUTE_PATTERNS) {
    if (pattern.test(normalized)) {
      return "platform";
    }
  }

  for (const listPath of PLATFORM_SHELL_OVERRIDES) {
    if (normalized === listPath) {
      return "platform";
    }
  }

  if (normalized === "/") {
    return "platform";
  }

  for (const prefix of DOCUMENT_SHELL_ROUTE_PREFIXES) {
    if (normalized.startsWith(prefix.replace(/\/$/, ""))) {
      const isListRoot = PLATFORM_SHELL_OVERRIDES.some(
        (p) => normalized === p,
      );
      if (!isListRoot) {
        return "document";
      }
    }
  }

  if (
    normalized.includes("/edit") ||
    normalized.endsWith("/new") ||
    normalized.endsWith("/form")
  ) {
    return "document";
  }

  return "platform";
}

export function resolveActiveDomain(pathname: string): PlatformDomainId {
  if (pathname.startsWith("/models")) {
    return "workspace";
  }
  if (
    pathname.startsWith("/factors") ||
    pathname.startsWith("/factor-sets") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/drugs") ||
    pathname.startsWith("/lookups")
  ) {
    return "registry";
  }
  if (pathname === "/" || pathname.startsWith("/home")) {
    return "platform";
  }
  return "registry";
}

export function getContextNavItems(domainId: PlatformDomainId): PlatformNavItem[] {
  const domain = PLATFORM_DOMAINS.find((d) => d.id === domainId);
  return domain?.items ?? [];
}
