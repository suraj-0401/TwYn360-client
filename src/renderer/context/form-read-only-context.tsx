"use client";

import { createContext, useContext, type ReactNode } from "react";

const FormReadOnlyContext = createContext(false);

export function FormReadOnlyProvider({
  children,
  readOnly = false,
}: {
  children: ReactNode;
  readOnly?: boolean;
}) {
  return (
    <FormReadOnlyContext.Provider value={readOnly}>
      {children}
    </FormReadOnlyContext.Provider>
  );
}

export function useFormReadOnly(): boolean {
  return useContext(FormReadOnlyContext);
}
