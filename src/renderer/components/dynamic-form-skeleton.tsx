import { Skeleton } from "@/components/ui/skeleton";
import { formSectionClass, formSectionGapClass } from "@/renderer/form-styles";
import { cn } from "@/lib/utils";

type DynamicFormSkeletonProps = {
  sectionCount?: number;
};

export function DynamicFormSkeleton({
  sectionCount = 3,
}: DynamicFormSkeletonProps) {
  return (
    <div className={formSectionGapClass}>
      {Array.from({ length: sectionCount }, (_, section) => (
        <div key={section} className={cn(formSectionClass, "px-6 py-5")}>
          <Skeleton className="mb-3 h-8 w-48 bg-white/[0.04]" />
          <Skeleton className="mb-8 h-4 w-64 bg-white/[0.04]" />
          <div className="grid grid-cols-12 gap-6">
            {Array.from({ length: 4 }, (_, field) => (
              <div key={field} className="col-span-12 sm:col-span-6">
                <Skeleton className="mb-2 h-4 w-24 bg-white/[0.04]" />
                <Skeleton className="h-9 w-full rounded-lg bg-white/[0.04]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
