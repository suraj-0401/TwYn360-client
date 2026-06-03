import type { ClinicalIntakeSection } from "@/types/clinical-intake";

/** Filter intake sections/fields by label, alias, slug, or section title. */
export function filterClinicalSections(
  sections: ClinicalIntakeSection[],
  query: string,
): ClinicalIntakeSection[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return sections;
  }

  return sections
    .map((section) => {
      const titleMatches = section.title.toLowerCase().includes(normalized);
      const inputs = section.inputs.filter((input) => {
        if (titleMatches) {
          return true;
        }
        return (
          input.label.toLowerCase().includes(normalized) ||
          input.alias.toLowerCase().includes(normalized) ||
          input.factorSlug.toLowerCase().includes(normalized)
        );
      });
      return { ...section, inputs };
    })
    .filter((section) => section.inputs.length > 0);
}
