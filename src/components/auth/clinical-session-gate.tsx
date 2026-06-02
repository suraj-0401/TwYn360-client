"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PLATFORM_PERSONA } from "@/config/persona";
import { hasSessionFor } from "@/lib/auth-session";

type ClinicalSessionGateProps = {
  children: ReactNode;
};

export function ClinicalSessionGate({ children }: ClinicalSessionGateProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hasSessionFor(PLATFORM_PERSONA.DOCTOR)) {
      setReady(true);
      return;
    }
    router.replace("/clinical/login");
  }, [router]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b] text-sm text-[#71717a]">
        Checking clinical session…
      </div>
    );
  }

  return children;
}
