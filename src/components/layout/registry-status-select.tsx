import { FilterField } from "@/components/layout/filter-field";
import { LIFECYCLE_STATUS } from "@/config/lifecycle";
import { cn } from "@/lib/utils";
import { platform } from "@/styles/tokens";

export type RegistryStatusFilter =
  | typeof LIFECYCLE_STATUS.ACTIVE
  | typeof LIFECYCLE_STATUS.ARCHIVED
  | "all";

type RegistryStatusSelectProps = {
  id?: string;
  value: RegistryStatusFilter;
  onChange: (value: RegistryStatusFilter) => void;
  className?: string;
};

export function RegistryStatusSelect({
  id = "status-filter",
  value,
  onChange,
  className,
}: RegistryStatusSelectProps) {
  return (
    <FilterField id={id} label="Status" className={className}>
      <select
        id={id}
        className={cn(platform.select, "min-w-[140px]")}
        value={value}
        onChange={(e) => onChange(e.target.value as RegistryStatusFilter)}
      >
        <option value={LIFECYCLE_STATUS.ACTIVE}>Active</option>
        <option value={LIFECYCLE_STATUS.ARCHIVED}>Archived</option>
        <option value="all">All</option>
      </select>
    </FilterField>
  );
}
