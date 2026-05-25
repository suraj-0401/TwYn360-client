import { cn } from "@/lib/utils";

type WorkspaceContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** No padding — for full-bleed workspace layouts */
  flush?: boolean;
  /** Fill parent height without outer scroll (workspace uses inner panes) */
  fill?: boolean;
};

export function WorkspaceContainer({
  children,
  className,
  flush = false,
  fill = false,
}: WorkspaceContainerProps) {
  return (
    <main
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col bg-[#09090b]",
        fill ? "overflow-hidden" : "overflow-auto",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          !flush && "p-4 md:p-6",
          fill && "min-h-0",
        )}
      >
        {children}
      </div>
    </main>
  );
}
