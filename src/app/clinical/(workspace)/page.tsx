import { ClinicalShell } from "@/components/layout/clinical-shell";
import { ClinicalHomeContent } from "@/modules/clinical/components/clinical-home-content";

export default function ClinicalHomePage() {
  return (
    <ClinicalShell hideHeader>
      <ClinicalHomeContent />
    </ClinicalShell>
  );
}
