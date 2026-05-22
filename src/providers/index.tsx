"use client";

import type { ReactNode } from "react";
import { FeedbackProvider } from "./feedback-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <FeedbackProvider>{children}</FeedbackProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
