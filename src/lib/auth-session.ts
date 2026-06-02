import type { HardcodedPortal } from "@/config/auth-credentials";
import { verifyHardcodedLogin } from "@/config/auth-credentials";
import {
  PLATFORM_PERSONA,
  PERSONA_STORAGE_KEY,
  type PlatformPersona,
  writeStoredPersona,
} from "@/config/persona";

export const SESSION_STORAGE_KEY = "twyn_auth_session";

export type AuthSession = {
  persona: PlatformPersona;
  email: string;
};

export function readSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession;
    if (
      parsed?.persona === PLATFORM_PERSONA.ADMIN ||
      parsed?.persona === PLATFORM_PERSONA.DOCTOR
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function establishSession(persona: PlatformPersona, email: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const session: AuthSession = { persona, email };
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  writeStoredPersona(persona);
}

export function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.localStorage.removeItem(PERSONA_STORAGE_KEY);
}

export function tryPortalLogin(
  email: string,
  password: string,
  portal: HardcodedPortal,
): AuthSession | null {
  const match = verifyHardcodedLogin(email, password, portal);
  if (!match) {
    return null;
  }
  establishSession(match.persona, match.email);
  return { persona: match.persona, email: match.email };
}

export function hasSessionFor(persona: PlatformPersona): boolean {
  return readSession()?.persona === persona;
}
