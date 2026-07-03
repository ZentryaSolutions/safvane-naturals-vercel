export const EXPENSE_CATEGORIES = [
  { id: "raw_materials", label: "Raw materials" },
  { id: "packaging", label: "Packaging" },
  { id: "shipping", label: "Shipping / logistics" },
  { id: "marketing", label: "Marketing" },
  { id: "labour", label: "Labour" },
  { id: "other", label: "Other" },
] as const;

export function expenseCategoryLabel(category: string): string {
  return EXPENSE_CATEGORIES.find((c) => c.id === category)?.label ?? category;
}
