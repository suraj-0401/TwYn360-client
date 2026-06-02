"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  PERSONA_LABEL,
  PLATFORM_PERSONA,
  readStoredPersona,
  writeStoredPersona,
  type PlatformPersona,
} from "@/config/persona";
import { readSession } from "@/lib/auth-session";

type PersonaContextValue = {
  persona: PlatformPersona;
  personaLabel: string;
  setPersona: (persona: PlatformPersona) => void;
};

const PersonaContext = createContext<PersonaContextValue | null>(null);

type PersonaProviderProps = {
  children: ReactNode;
  /** When set, overrides storage (e.g. clinical layout always uses doctor). */
  forcedPersona?: PlatformPersona;
};

export function PersonaProvider({
  children,
  forcedPersona,
}: PersonaProviderProps) {
  const [persona, setPersonaState] = useState<PlatformPersona>(
    forcedPersona ?? PLATFORM_PERSONA.ADMIN,
  );

  useEffect(() => {
    if (forcedPersona) {
      setPersonaState(forcedPersona);
      return;
    }
    const session = readSession();
    setPersonaState(session?.persona ?? readStoredPersona());
  }, [forcedPersona]);

  const setPersona = useCallback(
    (next: PlatformPersona) => {
      if (forcedPersona) {
        return;
      }
      writeStoredPersona(next);
      setPersonaState(next);
    },
    [forcedPersona],
  );

  const value = useMemo(
    () => ({
      persona: forcedPersona ?? persona,
      personaLabel: PERSONA_LABEL[forcedPersona ?? persona],
      setPersona,
    }),
    [forcedPersona, persona, setPersona],
  );

  return (
    <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>
  );
}

export function usePersona(): PersonaContextValue {
  const ctx = useContext(PersonaContext);
  if (!ctx) {
    throw new Error("usePersona must be used within PersonaProvider");
  }
  return ctx;
}
