import Link from "next/link";
import { cn } from "@/lib/utils";

type DocumentShellProps = {
  children: React.ReactNode;
  /** Use full viewport width (metadata builder canvas). */
  wide?: boolean;
};

/**
 * Focused editor shell — factor/drug builders, deep edit forms.
 * Not for list pages or platform workspace (use PlatformShell).
 */
export function DocumentShell({ children, wide }: DocumentShellProps) {
  return (
    <div className="min-h-full bg-[#0a0a0a]">
      <header className="border-b border-white/[0.04] bg-[#0a0a0a]">
        <div
          className={cn(
            "mx-auto flex h-14 items-center justify-between px-4 sm:px-6",
            wide ? "max-w-none" : "max-w-[1000px]",
          )}
        >
          <Link
            href="/"
            className="font-semibold tracking-tight text-[#f4f4f5]"
          >
            DFF Platform
          </Link>
          <Link
            href="/models"
            className="text-sm text-[#f4f4f5]/70 transition-colors hover:text-[#f4f4f5]"
          >
            Exit to platform
          </Link>
        </div>
      </header>
      <main
        className={cn(
          "mx-auto px-4 pb-8 sm:px-6",
          wide ? "max-w-none" : "max-w-[1000px]",
        )}
      >
        {children}
      </main>
    </div>
  );
}
