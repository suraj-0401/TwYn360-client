"use client";

import type { ReactNode } from "react";
import {
  ConfirmDialogProvider,
  Toaster,
} from "@/components/feedback";

type FeedbackProviderProps = {
  children: ReactNode;
};

export function FeedbackProvider({ children }: FeedbackProviderProps) {
  return (
    <ConfirmDialogProvider>
      {children}
      <Toaster />
    </ConfirmDialogProvider>
  );
}
