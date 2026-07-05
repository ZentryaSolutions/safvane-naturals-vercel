"use client";

import { useState } from "react";
import { Pencil, Save, Trash2 } from "lucide-react";
import {
  deleteProductVariant,
  saveProductVariant,
} from "@/app/admin/actions";
import { generateVariantSku } from "@/lib/sku";
import type { ProductVariant } from "@/lib/types";
import { useAdminToast } from "@/components/admin/AdminToastProvider";

type VariantDraft = Partial<ProductVariant> & {
  isEditing?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
};

interface ProductVariantsEditorProps {
  productId: string;
  productSlug: string;
  initialVariants: ProductVariant[];
}

function toDraft(v: ProductVariant): VariantDraft {
  return { ...v, isEditing: false };
}

function emptyDraft(): VariantDraft {
  return {
    variant_label: "",
    price: 0,
    compare_at_price: null,
    stock_quantity: 0,
    sku: "",
    isEditing: true,
  };
}

export function ProductVariantsEditor({
  productId,
  productSlug,
  initialVariants,
}: ProductVariantsEditorProps) {
  const { showToast } = useAdminToast();
  const [variants, setVariants] = useState<VariantDraft[]>(
    initialVariants.length ? initialVariants.map(toDraft) : [emptyDraft()]
  );

  const updateField = (index: number, field: string, value: string | number | null) => {
    setVariants((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value, isEditing: true } : row))
    );
  };

  const handleSave = async (index: number) => {
    const row = variants[index];
    setVariants((rows) =>
      rows.map((r, i) => (i === index ? { ...r, isSaving: true } : r))
    );

    const result = await saveProductVariant(productId, {
      id: row.id,
      variant_label: row.variant_label ?? "",
      price: Number(row.price) || 0,
      compare_at_price:
        row.compare_at_price === null || row.compare_at_price === undefined
          ? null
          : Number(row.compare_at_price) || null,
      stock_quantity: Number(row.stock_quantity) || 0,
      sku: row.sku ?? null,
    });

    if (result.error) {
      showToast("error", result.error);
      setVariants((rows) =>
        rows.map((r, i) => (i === index ? { ...r, isSaving: false } : r))
      );
      return;
    }

    showToast("success", row.id ? "Variant updated" : "Variant added");
    setVariants((rows) =>
      rows.map((r, i) =>
        i === index ? { ...toDraft(result.variant!), isSaving: false } : r
      )
    );
  };

  const handleDelete = async (index: number) => {
    const row = variants[index];
    if (variants.length <= 1) {
      showToast("error", "At least one variant is required.");
      return;
    }

    if (!row.id) {
      setVariants((rows) => rows.filter((_, i) => i !== index));
      return;
    }

    if (!confirm(`Delete variant "${row.variant_label}"?`)) return;

    setVariants((rows) =>
      rows.map((r, i) => (i === index ? { ...r, isDeleting: true } : r))
    );

    const result = await deleteProductVariant(productId, row.id);
    if (result.error) {
      showToast("error", result.error);
      setVariants((rows) =>
        rows.map((r, i) => (i === index ? { ...r, isDeleting: false } : r))
      );
      return;
    }

    showToast("success", "Variant deleted");
    setVariants((rows) => rows.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    setVariants((rows) => [...rows, emptyDraft()]);
  };

  return (
    <div className="admin-card admin-product-card">
      <div className="admin-product-card-head">
        <p className="admin-field-hint" style={{ margin: 0 }}>
          Save each variant individually. SKU is the barcode value — download PNGs under
          Packaging → Barcodes.
        </p>
        <button
          type="button"
          onClick={addVariant}
          className="admin-btn-ghost"
          style={{ padding: "6px 12px", fontSize: "0.8125rem", flexShrink: 0 }}
        >
          + Add variant
        </button>
      </div>

      <div className="admin-variants-table">
        <div className="admin-variants-table-head">
          <span>Label</span>
          <span>Price (PKR)</span>
          <span>Compare at</span>
          <span>Stock</span>
          <span>SKU / barcode</span>
          <span>Actions</span>
        </div>
        {variants.map((v, i) => (
          <div key={v.id ?? `new-${i}`} className="admin-variants-table-row">
            <input
              placeholder="100ml"
              value={v.variant_label ?? ""}
              disabled={!v.isEditing && Boolean(v.id)}
              onChange={(e) => updateField(i, "variant_label", e.target.value)}
            />
            <input
              type="number"
              placeholder="0"
              value={v.price ?? ""}
              disabled={!v.isEditing && Boolean(v.id)}
              onChange={(e) => updateField(i, "price", parseFloat(e.target.value) || 0)}
            />
            <input
              type="number"
              placeholder="—"
              value={v.compare_at_price ?? ""}
              disabled={!v.isEditing && Boolean(v.id)}
              onChange={(e) =>
                updateField(
                  i,
                  "compare_at_price",
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
            />
            <input
              type="number"
              placeholder="0"
              value={v.stock_quantity ?? ""}
              disabled={!v.isEditing && Boolean(v.id)}
              onChange={(e) =>
                updateField(i, "stock_quantity", parseInt(e.target.value, 10) || 0)
              }
            />
            <div className="admin-variant-sku-cell">
              <input
                placeholder="SFV-PRODUCT-100ML"
                value={v.sku ?? ""}
                disabled={!v.isEditing && Boolean(v.id)}
                onChange={(e) => updateField(i, "sku", e.target.value.toUpperCase())}
              />
              <button
                type="button"
                className="admin-btn-ghost admin-variant-suggest"
                disabled={!v.isEditing && Boolean(v.id)}
                onClick={() =>
                  updateField(
                    i,
                    "sku",
                    generateVariantSku(productSlug, v.variant_label || "std")
                  )
                }
              >
                Suggest
              </button>
            </div>
            <div className="admin-variant-actions">
              {v.id && !v.isEditing ? (
                <button
                  type="button"
                  className="admin-btn-ghost admin-variant-action-btn"
                  onClick={() =>
                    setVariants((rows) =>
                      rows.map((r, idx) =>
                        idx === i ? { ...r, isEditing: true } : r
                      )
                    )
                  }
                  title="Edit variant"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              ) : (
                <button
                  type="button"
                  className="admin-btn admin-variant-action-btn"
                  onClick={() => handleSave(i)}
                  disabled={v.isSaving}
                  title="Save variant"
                >
                  <Save size={14} />
                  {v.isSaving ? "..." : "Save"}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(i)}
                className="admin-btn-danger admin-variant-action-btn"
                disabled={v.isDeleting || variants.length <= 1}
                title="Delete variant"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
