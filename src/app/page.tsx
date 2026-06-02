import Link from "next/link";
import { ArrowRight, Beaker, Stethoscope } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PortalGatewayPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-6 text-zinc-100">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Twyn360 · Phase 0
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Choose your portal</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Platform admin and clinical workflows are separate sign-ins with different
            credentials and navigation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/login"
            className={cn(
              "group rounded-xl border border-white/10 bg-[#0f0f11] p-6 transition-colors hover:border-cyan-500/30 hover:bg-[#121218]",
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-300">
              <Beaker className="size-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Platform admin</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Registry, models, formulas, and scientific configuration.
            </p>
            <span
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-4 inline-flex border-white/10",
              )}
            >
              Admin sign-in
              <ArrowRight className="ml-2 size-3.5" />
            </span>
          </Link>

          <Link
            href="/clinical/login"
            className={cn(
              "group rounded-xl border border-white/10 bg-[#0f0f11] p-6 transition-colors hover:border-emerald-500/30 hover:bg-[#0a100e]",
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-300">
              <Stethoscope className="size-5" aria-hidden />
            </span>
            <h2 className="mt-4 text-lg font-semibold">Clinical</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Doctor-facing assessments and model runtime (Phase 2+).
            </p>
            <span
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-4 inline-flex border-white/10",
              )}
            >
              Clinical sign-in
              <ArrowRight className="ml-2 size-3.5" />
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
