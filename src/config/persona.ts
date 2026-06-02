/**
 * Phase 0 — hardcoded personas (no real auth).
 * Clinical routes force doctor; admin registry uses platform-admin.
 */

export const PLATFORM_PERSONA = {
  ADMIN: "admin",
  DOCTOR: "doctor",
} as const;

export type PlatformPersona =
  (typeof PLATFORM_PERSONA)[keyof typeof PLATFORM_PERSONA];

export const PERSONA_STORAGE_KEY = "twyn_platform_persona";

export const PERSONA_ACTOR_EMAIL: Record<PlatformPersona, string> = {
  [PLATFORM_PERSONA.ADMIN]: "platform-admin@dev",
  [PLATFORM_PERSONA.DOCTOR]: "dr.demo@twyn360",
};

export const PERSONA_LABEL: Record<PlatformPersona, string> = {
  [PLATFORM_PERSONA.ADMIN]: "Platform admin",
  [PLATFORM_PERSONA.DOCTOR]: "Dr. Demo",
};

export function isPlatformPersona(value: string): value is PlatformPersona {
  return value === PLATFORM_PERSONA.ADMIN || value === PLATFORM_PERSONA.DOCTOR;
}

export function readStoredPersona(): PlatformPersona {
  if (typeof window === "undefined") {
    return PLATFORM_PERSONA.ADMIN;
  }

  const sessionRaw = window.localStorage.getItem("twyn_auth_session");
  if (sessionRaw) {
    try {
      const session = JSON.parse(sessionRaw) as { persona?: string };
      if (session.persona && isPlatformPersona(session.persona)) {
        return session.persona;
      }
    } catch {
      // ignore malformed session
    }
  }

  const stored = window.localStorage.getItem(PERSONA_STORAGE_KEY);
  if (stored && isPlatformPersona(stored)) {
    return stored;
  }
  return PLATFORM_PERSONA.ADMIN;
}

export function writeStoredPersona(persona: PlatformPersona): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(PERSONA_STORAGE_KEY, persona);
}

export function getPersonaRequestHeaders(
  persona: PlatformPersona,
): Record<string, string> {
  return {
    "x-persona": persona,
    "x-actor": PERSONA_ACTOR_EMAIL[persona],
  };
}
