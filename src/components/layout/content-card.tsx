import { cn } from "@/lib/utils";

type ContentCardProps = {
  children: React.ReactNode;
  className?: string;
  /** Remove padding for full-bleed tables */
  flush?: boolean;
};

export function ContentCard({
  children,
  className,
  flush = false,
}: ContentCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/[0.06] bg-[#111113] shadow-sm",
        !flush && "p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
