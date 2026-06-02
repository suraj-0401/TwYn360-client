import type { ReactNode } from "react";

/** Passthrough — login vs workspace layouts handle persona and gates. */
export default function ClinicalRootLayout({ children }: { children: ReactNode }) {
  return children;
}
