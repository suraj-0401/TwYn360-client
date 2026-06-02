import { PLATFORM_PERSONA, type PlatformPersona } from "@/config/persona";

/** Phase 0 — hardcoded accounts (not secure; replace with real auth later). */
export const HARDCODED_ACCOUNTS = {
  admin: {
    email: "admin@twyn.local",
    password: "admin",
    persona: PLATFORM_PERSONA.ADMIN,
    portalLabel: "Platform admin",
    redirectPath: "/home",
  },
  doctor: {
    email: "doctor@twyn.local",
    password: "doctor",
    persona: PLATFORM_PERSONA.DOCTOR,
    portalLabel: "Clinical",
    redirectPath: "/clinical",
  },
} as const;

export type HardcodedPortal = keyof typeof HARDCODED_ACCOUNTS;

export function verifyHardcodedLogin(
  email: string,
  password: string,
  portal: HardcodedPortal,
): { persona: PlatformPersona; email: string } | null {
  const account = HARDCODED_ACCOUNTS[portal];
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail !== account.email || password !== account.password) {
    return null;
  }

  return { persona: account.persona, email: account.email };
}

export function getAccountHint(portal: HardcodedPortal): {
  email: string;
  password: string;
} {
  const account = HARDCODED_ACCOUNTS[portal];
  return { email: account.email, password: account.password };
}
