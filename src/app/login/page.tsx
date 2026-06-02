"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { HardcodedLoginForm } from "@/components/auth/hardcoded-login-form";
import { PLATFORM_PERSONA } from "@/config/persona";
import { hasSessionFor } from "@/lib/auth-session";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  useEffect(() => {
    if (hasSessionFor(PLATFORM_PERSONA.ADMIN)) {
      router.replace(next && next.startsWith("/") ? next : "/home");
    }
  }, [next, router]);

  const redirectPath =
    next && next.startsWith("/") && !next.startsWith("/clinical")
      ? next
      : undefined;

  return (
    <HardcodedLoginForm
      portal="admin"
      otherPortalHref="/clinical/login"
      otherPortalLabel="Clinical sign-in"
      redirectPath={redirectPath}
    />
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
