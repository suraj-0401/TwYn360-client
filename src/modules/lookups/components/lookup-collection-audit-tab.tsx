"use client";

export function LookupCollectionAuditTab() {
  return (
    <div className="rounded-lg border border-dashed border-white/[0.08] px-6 py-12 text-center">
      <p className="text-sm font-medium text-[#a1a1aa]">Audit history</p>
      <p className="mt-2 max-w-md mx-auto text-xs text-[#52525b]">
        Change history for lookup values (who changed, when, dependency impact)
        will appear here in a later release.
      </p>
    </div>
  );
}
