"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { generateVariantSkus } from "@/app/admin/batch-actions";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import { downloadBarcodePng } from "@/lib/barcode";
import { generateVariantSku } from "@/lib/sku";
import type { ProductVariant } from "@/lib/types";

interface VariantBarcodesProps {
  productId: string;
  productSlug: string;
  productName: string;
  variants: ProductVariant[];
  embedded?: boolean;
}

export function VariantBarcodes({
  productId,
  productSlug,
  productName,
  variants,
  embedded,
}: VariantBarcodesProps) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [generating, setGenerating] = useState(false);

  const missingSku = variants.some((v) => !v.sku?.trim());

  const handleGenerateSkus = async () => {
    setGenerating(true);
    const result = await generateVariantSkus(productId, productSlug);
    if (result.error) showToast("error", result.error);
    else {
      showToast("success", "SKUs generated for variants that were missing one");
      router.refresh();
    }
    setGenerating(false);
  };

  const handleDownload = (variant: ProductVariant) => {
    const sku = variant.sku?.trim() || generateVariantSku(productSlug, variant.variant_label);
    const safeName = `${productName}-${variant.variant_label}`
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "");
    downloadBarcodePng(sku, safeName || "barcode");
  };

  return (
    <div className={`admin-card admin-packaging-card${embedded ? " admin-packaging-card-embedded" : ""}`}>
      <div className="admin-packaging-card-head">
        {!embedded && <h2 className="admin-section-title">Barcodes</h2>}
        {missingSku && (
          <button
            type="button"
            className="admin-btn-ghost admin-btn-sm"
            onClick={handleGenerateSkus}
            disabled={generating}
          >
            <RefreshCw size={14} />
            {generating ? "Generating…" : "Auto-generate SKUs"}
          </button>
        )}
      </div>

      <p className="admin-field-hint admin-barcode-hint">
        Each variant SKU is encoded as <strong>Code 128</strong>. Scanners read the SKU text
        (e.g. <code>SFV-BLACKSEED-100ML</code>) — ideal for packing and inventory.
      </p>

      <div className="admin-barcode-grid">
        {variants.map((variant) => {
          const sku =
            variant.sku?.trim() || generateVariantSku(productSlug, variant.variant_label);
          return (
            <div key={variant.id} className="admin-barcode-card">
              <div className="admin-barcode-card-body">
                <p className="admin-barcode-label">{variant.variant_label}</p>
                <p className="admin-barcode-sku">{sku}</p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-sm"
                onClick={() => handleDownload(variant)}
              >
                <Download size={14} />
                Download PNG
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
