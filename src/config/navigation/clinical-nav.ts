import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Stethoscope } from "lucide-react";

export type ClinicalNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  matchPrefix: string;
};

export const CLINICAL_NAV_ITEMS: ClinicalNavItem[] = [
  {
    id: "home",
    label: "Dashboard",
    href: "/clinical",
    icon: LayoutDashboard,
    matchPrefix: "/clinical",
  },
];

export const CLINICAL_PORTAL = {
  title: "Twyn Clinical",
  subtitle: "Clinical workspace",
  icon: Stethoscope,
} as const;
