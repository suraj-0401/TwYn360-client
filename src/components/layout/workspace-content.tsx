import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type WorkspaceContentProps = {
  children: ReactNode;
  className?: string;
};

/** Full-width main column inside platform shell */
export function WorkspaceContent({ children, className }: WorkspaceContentProps) {
  return (
    <div className={cn("w-full min-w-0 px-4 py-4 md:px-6 md:py-6", className)}>
      {children}
    </div>
  );
}
