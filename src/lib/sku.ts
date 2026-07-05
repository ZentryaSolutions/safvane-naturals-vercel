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
  const d = new Date(date);
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${month}-${year}`;
}
