"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HardcodedLoginForm } from "@/components/auth/hardcoded-login-form";
import { PLATFORM_PERSONA } from "@/config/persona";
import { hasSessionFor } from "@/lib/auth-session";

export default function ClinicalLoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (hasSessionFor(PLATFORM_PERSONA.DOCTOR)) {
      router.replace("/clinical");
    }
  }, [router]);

  return (
    <HardcodedLoginForm
      portal="doctor"
      otherPortalHref="/login"
      otherPortalLabel="Platform admin sign-in"
    />
  );
}
