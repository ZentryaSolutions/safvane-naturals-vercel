"use client";

import { useState } from "react";
import { Barcode, Layers, Tag } from "lucide-react";
import { BoxBackLabel } from "@/components/admin/BoxBackLabel";
import { ProductBatches } from "@/components/admin/ProductBatches";
import { VariantBarcodes } from "@/components/admin/VariantBarcodes";
import type { ProductBatch, ProductVariant } from "@/lib/types";

type PackagingTab = "batches" | "barcodes" | "label";

const TABS: { id: PackagingTab; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "batches",
    label: "Production batches",
    description: "Batch numbers, MFG/EXP dates, and traceability",
    icon: <Layers size={16} />,
  },
  {
    id: "barcodes",
    label: "Barcodes",
    description: "Download Code 128 barcode PNGs per variant",
    icon: <Barcode size={16} />,
  },
  {
    id: "label",
    label: "Box back label",
    description: "Batch, MFG & EXP dates, then QR to safvane.com (vertical)",
    icon: <Tag size={16} />,
  },
];

interface ProductPackagingPanelProps {
  productId: string;
  productSlug: string;
  productName: string;
  variants: ProductVariant[];
  batches: ProductBatch[];
}

export function ProductPackagingPanel({
  productId,
  productSlug,
  productName,
  variants,
  batches,
}: ProductPackagingPanelProps) {
  const [tab, setTab] = useState<PackagingTab>("batches");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="admin-packaging-panel">
      <div className="admin-packaging-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`admin-packaging-tab${tab === item.id ? " active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <p className="admin-packaging-tab-desc">{active.description}</p>

      <div className="admin-packaging-tab-content">
        {tab === "batches" && (
          <ProductBatches
            productId={productId}
            productSlug={productSlug}
            variants={variants}
            batches={batches}
            embedded
          />
        )}
        {tab === "barcodes" && (
          <VariantBarcodes
            productId={productId}
            productSlug={productSlug}
            productName={productName}
            variants={variants}
            embedded
          />
        )}
        {tab === "label" && (
          <BoxBackLabel
            productName={productName}
            productSlug={productSlug}
            variants={variants}
            batches={batches}
            embedded
          />
        )}
      </div>
    </div>
  );
}
