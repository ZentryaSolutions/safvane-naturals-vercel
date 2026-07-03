/** Build a consistent internal SKU used as the barcode value (Code 128). */
export function generateVariantSku(productSlug: string, variantLabel: string): string {
  const productCode = productSlug
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()
    .slice(0, 16);

  const sizeCode = variantLabel
    .replace(/[^a-z0-9]+/gi, "")
    .toUpperCase()
    .slice(0, 8);

  return `SFV-${productCode || "PRODUCT"}-${sizeCode || "STD"}`;
}

export function formatPackDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
