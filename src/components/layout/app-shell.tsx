import Link from "next/link";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  /** Full-width layout for form documents (factor create/edit view). */
  document?: boolean;
  /** Use full viewport width (metadata builder canvas). */
  wide?: boolean;
};

export function AppShell({ children, document: documentMode, wide }: AppShellProps) {
  const containerClass = wide || documentMode ? "max-w-none" : "max-w-6xl";

  return (
    <div
      className={cn(
        "min-h-full",
        documentMode ? "bg-[#0a0a0a]" : "bg-zinc-50 dark:bg-zinc-950",
      )}
    >
      <header
        className={cn(
          "border-b",
          documentMode
            ? "border-white/[0.04] bg-[#0a0a0a]"
            : "bg-white dark:bg-zinc-900",
        )}
      >
        <div
          className={cn(
            "mx-auto flex h-14 items-center justify-between px-4 sm:px-6",
            documentMode ? "max-w-[1000px]" : containerClass,
          )}
        >
          <Link
            href="/"
            className={cn(
              "font-semibold tracking-tight",
              documentMode ? "text-[#f4f4f5]" : undefined,
            )}
          >
            DFF Platform
          </Link>
          <nav
            className={cn(
              "flex items-center gap-4 text-sm",
              documentMode ? "text-[#f4f4f5]/70" : undefined,
            )}
          >
            <Link
              href="/factors"
              className={cn(
                documentMode ? "hover:text-[#f4f4f5]" : "hover:underline",
              )}
            >
              Factor Registry
            </Link>
            <Link
              href="/lookups"
              className={cn(
                documentMode ? "hover:text-[#f4f4f5]" : "hover:underline",
              )}
            >
              Lookups
            </Link>
          </nav>
        </div>
      </header>
      <main
        className={cn(
          "mx-auto",
          documentMode ? "max-w-[1000px] px-4 pb-8 sm:px-6" : `px-4 py-8 ${containerClass}`,
        )}
      >
        {children}
      </main>
    </div>
  );
}
