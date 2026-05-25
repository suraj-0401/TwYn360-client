import { Suspense } from "react";
import { LookupCollectionPageContent } from "@/modules/lookups/components/lookup-collection-page-content";

type PageProps = {
  params: Promise<{ code: string }>;
};

export default async function LookupCollectionPage({ params }: PageProps) {
  const { code } = await params;

  return (
    <Suspense
      fallback={
        <div className="px-6 py-8 text-sm text-[#71717a]">Loading…</div>
      }
    >
      <LookupCollectionPageContent code={decodeURIComponent(code)} />
    </Suspense>
  );
}
