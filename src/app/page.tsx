import Link from "next/link";
import { PlatformShell } from "@/components/layout/platform-shell";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";

const LINKS: { href: string; label: string; primary?: boolean }[] = [
  { href: "/models", label: "Models", primary: true },
  { href: "/factors", label: "Factor registry" },
  { href: "/factor-sets", label: "Factor sets" },
  { href: "/drugs", label: "Drugs" },
  { href: "/categories", label: "Categories" },
  { href: "/lookups", label: "Lookups" },
];

export default function Home() {
  return (
    <PlatformShell
      domainId="platform"
      breadcrumbs={[{ label: "Control center" }]}
    >
      <PageHeader
        title="Scientific control center"
        description="Metadata-driven scientific workflow — categories, drugs, models, factor registry, and factor sets."
      />
      <div className="flex flex-wrap gap-2">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              buttonVariants({
                variant: link.primary ? "default" : "outline",
                size: "sm",
              }),
              link.primary
                ? platform.primaryButton
                : "border-white/10 bg-transparent text-[#a1a1aa] hover:bg-white/[0.04] hover:text-[#f4f4f5]",
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </PlatformShell>
  );
}
