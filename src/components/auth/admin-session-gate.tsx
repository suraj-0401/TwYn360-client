"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PLATFORM_PERSONA } from "@/config/persona";
import { hasSessionFor } from "@/lib/auth-session";

type AdminSessionGateProps = {
  children: ReactNode;
};

export function AdminSessionGate({ children }: AdminSessionGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hasSessionFor(PLATFORM_PERSONA.ADMIN)) {
      setReady(true);
      return;
    }
    const next = encodeURIComponent(pathname);
    router.replace(`/login?next=${next}`);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b] text-sm text-[#71717a]">
        Checking admin session…
      </div>
    );
  }

  return children;
}
