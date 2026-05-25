/**
 * Platform shell design tokens (P2).
 * Use via `platform.*` helpers or CSS vars `--platform-*` in globals.css.
 */
export const platformTokens = {
  bg: {
    canvas: "#09090b",
    sidebar: "#08080a",
    sidebarPanel: "#0c0c0e",
    card: "#111113",
    input: "#0a0a0a",
    rowHover: "rgba(255,255,255,0.02)",
    rowActive: "rgba(255,255,255,0.04)",
  },
  border: {
    subtle: "rgba(255,255,255,0.06)",
    faint: "rgba(255,255,255,0.04)",
  },
  text: {
    primary: "#f4f4f5",
    secondary: "#a1a1aa",
    muted: "#71717a",
    faint: "#52525b",
  },
  accent: {
    link: "#22d3ee",
    linkHover: "#67e8f9",
    ring: "rgba(34,211,238,0.35)",
  },
} as const;

/** Tailwind class bundles for platform list surfaces */
export const platform = {
  pageTitle: "text-xl font-semibold tracking-tight text-[#f4f4f5]",
  pageDescription: "text-sm text-[#a1a1aa]",
  card: "rounded-lg border border-white/[0.06] bg-[#111113]",
  input:
    "h-9 rounded-md border border-white/10 bg-[#0a0a0a] text-sm text-[#f4f4f5] placeholder:text-[#52525b]",
  select:
    "h-9 rounded-md border border-white/10 bg-[#0a0a0a] px-3 text-sm text-[#f4f4f5]",
  label: "text-xs font-medium text-[#71717a]",
  primaryButton:
    "bg-[#f4f4f5] text-[#0a0a0a] hover:bg-white shadow-sm",
  tableHead:
    "h-8 border-b border-white/[0.06] bg-[#111113] text-xs font-medium uppercase tracking-wide text-[#71717a]",
  tableRow:
    "border-white/[0.04] transition-colors hover:bg-white/[0.02] data-[clickable=true]:cursor-pointer",
  tableCell: "py-2.5 px-3 text-sm",
  link: "text-[#a1a1aa] hover:text-[#f4f4f5] hover:underline",
} as const;
