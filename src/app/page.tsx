import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <AppShell>
      <div className="rounded-lg border bg-white p-8 dark:bg-zinc-900">
        <h1 className="text-3xl font-semibold">DFF Scientific Platform</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Metadata-driven scientific workflow platform — Factor Registry and
          configurable metadata workspaces.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/factors"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Factor Registry
          </Link>
          <Link
            href="/lookups"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Lookup collections
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
