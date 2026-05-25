import { DocumentShell } from "./document-shell";

type AppShellProps = {
  children: React.ReactNode;
  /** @deprecated Use DocumentShell — kept for builder pages */
  document?: boolean;
  wide?: boolean;
};

/**
 * Legacy export — maps to DocumentShell for focused editors.
 * List/platform pages should use PlatformShell.
 */
export function AppShell({ children, document: _document, wide }: AppShellProps) {
  return <DocumentShell wide={wide}>{children}</DocumentShell>;
}

export { DocumentShell } from "./document-shell";
export { PlatformShell } from "./platform-shell";
export { PlatformPageShell } from "./platform-page-shell";
