import { Suspense } from "react";
import { LookupsPageContent } from "@/modules/lookups/components/lookups-page-content";

export default function LookupsPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-8 text-sm text-[#71717a]">Loading lookups…</div>
      }
    >
      <LookupsPageContent />
    </Suspense>
  );
}
