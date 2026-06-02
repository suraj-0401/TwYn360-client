/** Trim verbose platform labels for clinician-facing UI. */
export function shortenOutcomeLabel(displayName: string): string {
  return displayName.replace(/^Predicted\s+/i, "").trim();
}
