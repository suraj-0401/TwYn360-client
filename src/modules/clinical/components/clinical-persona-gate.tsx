"use client";

import { useEffect, type ReactNode } from "react";
import { PLATFORM_PERSONA, writeStoredPersona } from "@/config/persona";

/** Ensures API calls from clinical routes use the hardcoded doctor persona. */
export function ClinicalPersonaGate({ children }: { children: ReactNode }) {
  useEffect(() => {
    writeStoredPersona(PLATFORM_PERSONA.DOCTOR);
  }, []);

  return children;
}
