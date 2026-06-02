import type { ReactNode } from "react";
import { ClinicalSessionGate } from "@/components/auth/clinical-session-gate";
import { ClinicalPersonaGate } from "@/modules/clinical/components/clinical-persona-gate";
import { PersonaProvider } from "@/providers/persona-provider";
import { PLATFORM_PERSONA } from "@/config/persona";

export default function ClinicalWorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClinicalSessionGate>
      <PersonaProvider forcedPersona={PLATFORM_PERSONA.DOCTOR}>
        <ClinicalPersonaGate>{children}</ClinicalPersonaGate>
      </PersonaProvider>
    </ClinicalSessionGate>
  );
}
