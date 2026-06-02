"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { HardcodedPortal } from "@/config/auth-credentials";
import { getAccountHint, HARDCODED_ACCOUNTS } from "@/config/auth-credentials";
import { tryPortalLogin } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type HardcodedLoginFormProps = {
  portal: HardcodedPortal;
  otherPortalHref: string;
  otherPortalLabel: string;
  /** Override default post-login path (e.g. admin `?next=` deep link). */
  redirectPath?: string;
};

export function HardcodedLoginForm({
  portal,
  otherPortalHref,
  otherPortalLabel,
  redirectPath,
}: HardcodedLoginFormProps) {
  const router = useRouter();
  const account = HARDCODED_ACCOUNTS[portal];
  const hint = getAccountHint(portal);
  const [email, setEmail] = useState(hint.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const session = tryPortalLogin(email, password, portal);
    if (!session) {
      setError("Invalid email or password for this portal.");
      setSubmitting(false);
      return;
    }

    router.replace(redirectPath ?? account.redirectPath);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-6 text-zinc-100">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-white/10 bg-[#0f0f11] p-8">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Phase 0 · Hardcoded sign-in
          </p>
          <h1 className="mt-2 text-xl font-semibold">{account.portalLabel}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            This portal is separate from the other role. Use only{" "}
            <span className="font-mono text-zinc-300">{account.portalLabel}</span>{" "}
            credentials here.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="border-white/10 bg-[#121216]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="border-white/10 bg-[#121216]"
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="rounded-md border border-dashed border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-zinc-500">
          Dev credentials: {hint.email} / {hint.password}
        </p>

        <p className="text-center text-xs text-zinc-500">
          <Link
            href="/"
            className="text-zinc-400 underline-offset-4 hover:underline"
          >
            Choose a different portal
          </Link>
          {" · "}
          <Link
            href={otherPortalHref}
            className="text-zinc-400 underline-offset-4 hover:underline"
          >
            {otherPortalLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
