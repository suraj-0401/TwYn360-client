"use client";

import type { ReactNode } from "react";
import { FeedbackProvider } from "./feedback-provider";
import { PersonaProvider } from "./persona-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <PersonaProvider>
        <QueryProvider>
          <FeedbackProvider>{children}</FeedbackProvider>
        </QueryProvider>
      </PersonaProvider>
    </ThemeProvider>
  );
}
