"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  ImageIcon,
  Layers,
  Package,
  Percent,
  Settings2,
} from "lucide-react";
import { deleteProduct } from "@/app/admin/actions";
import { ProductPackagingPanel } from "@/components/admin/ProductPackagingPanel";
import { ProductForm } from "@/components/admin/ProductForm";
import type { Category, Product, ProductBatch, ProductImage, ProductVariant } from "@/lib/types";

export type ProductEditSection =
  | "basics"
  | "content"
  | "variants"
  | "offers"
  | "images"
  | "packaging";

const SECTION_META: Record<
  ProductEditSection,
  { label: string; description: string; icon: React.ReactNode }
> = {
  basics: {
    label: "Basics",
    description: "Name, category, status, and short description",
    icon: <Settings2 size={18} />,
  },
  content: {
    label: "Storefront content",
    description: "Product page tabs — details, usage, ingredients",
    icon: <FileText size={18} />,
  },
  variants: {
    label: "Variants & SKUs",
    description: "Sizes, pricing, stock, and barcode values",
    icon: <Layers size={18} />,
  },
  offers: {
    label: "Shipping & promos",
    description: "Per-product free shipping and promotional offers",
    icon: <Percent size={18} />,
  },
  images: {
    label: "Images",
    description: "Product photos for the shop and PDP",
    icon: <ImageIcon size={18} />,
  },
  packaging: {
    label: "Packaging",
    description: "Barcodes, production batches, and box labels",
    icon: <Package size={18} />,
  },
};

interface ProductEditWorkspaceProps {
  mode: "create" | "edit";
  categories: Category[];
  product?: Product & {
    variants: ProductVariant[];
    images: ProductImage[];
  };
  batches?: ProductBatch[];
}

export function ProductEditWorkspace({
  mode,
  categories,
  product,
  batches = [],
}: ProductEditWorkspaceProps) {
  const router = useRouter();
  const availableSections: ProductEditSection[] =
    mode === "edit"
      ? ["basics", "content", "variants", "offers", "images", "packaging"]
      : ["basics", "content", "variants"];

  const [section, setSection] = useState<ProductEditSection>("basics");
  const [saving, setSaving] = useState(false);
  const meta = SECTION_META[section];

  const handleDelete = async () => {
    if (!product?.id || !confirm("Delete this product permanently?")) return;
    await deleteProduct(product.id);
    router.push("/admin/products");
  };

  return (
    <div className="admin-product-workspace">
      <header className="admin-product-workspace-header">
        <div className="admin-product-workspace-header-left">
          <Link href="/admin/products" className="admin-product-back">
            ← Products
          </Link>
          <h1 className="admin-product-workspace-title">
            {mode === "edit" ? product?.name : "New product"}
          </h1>
        </div>
        <div className="admin-product-workspace-actions">
          {mode === "edit" && product && (
            <button type="button" onClick={handleDelete} className="admin-btn-danger">
              Delete
            </button>
          )}
          <Link href="/admin/products" className="admin-btn-ghost">
            Cancel
          </Link>
          <button
            type="submit"
            form="product-edit-form"
            className="admin-btn"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : mode === "edit"
                ? "Save changes"
                : "Create product"}
          </button>
        </div>
      </header>

      <div className="admin-product-workspace-body">
        <nav className="admin-product-nav" aria-label="Product sections">
          {availableSections.map((id) => {
            const item = SECTION_META[id];
            return (
              <button
                key={id}
                type="button"
                className={`admin-product-nav-item${section === id ? " active" : ""}`}
                onClick={() => setSection(id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <main className="admin-product-panel">
          <div className="admin-product-panel-head">
            <h2>{meta.label}</h2>
            <p>{meta.description}</p>
          </div>

          <ProductForm
            product={product}
            categories={categories}
            workspaceMode
            activeSection={section}
            formId="product-edit-form"
            showActions={false}
            onSavingChange={setSaving}
          />

          {mode === "edit" && product && section === "packaging" && (
            <ProductPackagingPanel
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              variants={product.variants ?? []}
              batches={batches}
            />
          )}
        </main>
      </div>
    </div>
  );
}
