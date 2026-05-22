"use client";

import { createContext, useContext, type ReactNode } from "react";

const FormDocumentContext = createContext(false);

export function FormDocumentProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  return (
    <FormDocumentContext.Provider value={enabled}>
      {children}
    </FormDocumentContext.Provider>
  );
}

/** True when rendering the fill/view form (not the layout builder). */
export function useFormDocument(): boolean {
  return useContext(FormDocumentContext);
}
