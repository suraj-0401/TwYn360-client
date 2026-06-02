"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlatformPersona } from "@/config/persona";
import { PLATFORM_PERSONA } from "@/config/persona";
import { clearSession } from "@/lib/auth-session";

type SignOutButtonProps = {
  persona: PlatformPersona;
  className?: string;
};

export function SignOutButton({ persona, className }: SignOutButtonProps) {
  const router = useRouter();

  function handleSignOut() {
    clearSession();
    router.replace(
      persona === PLATFORM_PERSONA.DOCTOR ? "/clinical/login" : "/login",
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      onClick={handleSignOut}
    >
      <LogOut className="mr-2 size-3.5" />
      Sign out
    </Button>
  );
}
