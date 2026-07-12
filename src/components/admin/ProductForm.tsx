"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveProduct, deleteProduct } from "@/app/admin/actions";
import { slugify } from "@/lib/utils";
import { formatBenefitsForEditor } from "@/lib/rich-content";
import type { Category, Product, ProductImage, ProductVideo, ProductVariant } from "@/lib/types";
import type { ProductEditSection } from "@/components/admin/ProductEditWorkspace";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { ProductVariantsEditor } from "@/components/admin/ProductVariantsEditor";
import { ProductImagesEditor } from "@/components/admin/ProductImagesEditor";
import { ProductVideosEditor } from "@/components/admin/ProductVideosEditor";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import { Trash2 } from "lucide-react";

function toDatetimeLocal(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type ContentTab = "description" | "how_to_use" | "ingredients" | "delivery_returns" | "benefits";

type ContentFields = Record<ContentTab, string>;

const CONTENT_TABS: { id: ContentTab; label: string; hint: string }[] = [
  {
    id: "description",
    label: "Product details",
    hint: "Main product information shown on the Product Details tab.",
  },
  {
    id: "how_to_use",
    label: "How to use",
    hint: "Usage instructions for customers.",
  },
  {
    id: "ingredients",
    label: "Ingredients",
    hint: "What is inside the product.",
  },
  {
    id: "delivery_returns",
    label: "Delivery & returns",
    hint: "Shipping, COD, and return policy.",
  },
  {
    id: "benefits",
    label: "Key benefits",
    hint: "Optional — appended at the end of Product Details on the shop.",
  },
];

interface ProductFormProps {
  product?: Product & {
    variants: ProductVariant[];
    images: ProductImage[];
    videos?: ProductVideo[];
  };
  categories: Category[];
  workspaceMode?: boolean;
  activeSection?: ProductEditSection;
  formId?: string;
  showActions?: boolean;
  onSavingChange?: (saving: boolean) => void;
}

function Section({
  id,
  activeSection,
  workspaceMode,
  children,
}: {
  id: ProductEditSection;
  activeSection?: ProductEditSection;
  workspaceMode?: boolean;
  children: React.ReactNode;
}) {
  if (!workspaceMode) return <>{children}</>;
  return (
    <div
      className={`admin-product-section${activeSection !== id ? " admin-product-section-hidden" : ""}`}
    >
      {children}
    </div>
  );
}

export function ProductForm({
  product,
  categories,
  workspaceMode = false,
  activeSection = "basics",
  formId,
  showActions = true,
  onSavingChange,
}: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [contentTab, setContentTab] = useState<ContentTab>("description");
  const [useShopShipping, setUseShopShipping] = useState(
    product?.use_shop_shipping ?? true
  );
  const [productFreeShipping, setProductFreeShipping] = useState(
    product?.product_free_shipping ?? false
  );
  const [contentFields, setContentFields] = useState<ContentFields>({
    description: product?.description ?? "",
    how_to_use: product?.how_to_use ?? "",
    ingredients: product?.ingredients ?? "",
    delivery_returns: product?.delivery_returns ?? "",
    benefits: formatBenefitsForEditor(product?.benefits),
  });

  const handleNameChange = (val: string) => {
    setName(val);
    if (!product) setSlug(slugify(val));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    onSavingChange?.(true);
    setError("");

    const form = new FormData(e.currentTarget);
    form.set("description", contentFields.description);
    form.set("how_to_use", contentFields.how_to_use);
    form.set("ingredients", contentFields.ingredients);
    form.set("delivery_returns", contentFields.delivery_returns);
    form.set("benefits", contentFields.benefits);

    const formEl = e.currentTarget;
    const freeShippingOn = productFreeShipping;
    const shopShippingOn = freeShippingOn ? false : useShopShipping;

    form.set("use_shop_shipping", shopShippingOn ? "on" : "off");
    form.set("product_free_shipping", freeShippingOn ? "on" : "off");
    form.set(
      "use_shop_promo",
      (formEl.elements.namedItem("use_shop_promo") as HTMLInputElement)?.checked ? "on" : "off"
    );
    form.set(
      "promo_enabled",
      (formEl.elements.namedItem("promo_enabled") as HTMLInputElement)?.checked ? "on" : "off"
    );

    if (!contentFields.description.trim()) {
      const msg = "Product details content is required.";
      setError(msg);
      showToast("error", msg);
      setSaving(false);
      onSavingChange?.(false);
      return;
    }

    const result = await saveProduct(form);
    if (result.error) {
      setError(result.error);
      showToast("error", result.error);
      setSaving(false);
      onSavingChange?.(false);
      return;
    }

    showToast(
      "success",
      product ? "Product saved successfully" : "Product created successfully"
    );

    if (!product && result.productId) {
      router.push(`/admin/products/${result.productId}`);
    } else {
      router.refresh();
    }
    setSaving(false);
    onSavingChange?.(false);
  };

  const handleDelete = async () => {
    if (!product?.id || !confirm("Delete this product?")) return;
    await deleteProduct(product.id);
    router.push("/admin/products");
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={`admin-form${workspaceMode ? " admin-product-form" : ""}`}
    >
      {error && <div className="admin-alert-error">{error}</div>}
      {product && <input type="hidden" name="id" value={product.id} />}

      <Section id="basics" activeSection={activeSection} workspaceMode={workspaceMode}>
        <div className="admin-card admin-product-card">
          <div className="admin-product-basics-grid">
            <div className="field admin-product-field-span-2">
              <label>Name *</label>
              <input
                name="name"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div className="field admin-product-field-span-2">
              <label>Slug *</label>
              <input
                name="slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Category *</label>
              <select
                name="category_id"
                required
                defaultValue={product?.category_id ?? categories[0]?.id}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Status</label>
              <select name="status" defaultValue={product?.status ?? "active"}>
                <option value="draft">Draft (hidden from shop)</option>
                <option value="active">Active (visible on shop)</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div className="field admin-product-field-span-2">
              <label>Short description</label>
              <textarea
                name="short_description"
                maxLength={160}
                rows={3}
                className="admin-short-description"
                defaultValue={product?.short_description ?? ""}
                placeholder="One line shown near the buy button on the product page (max 160 characters)"
              />
              <p className="admin-field-hint">Max 160 characters — shown on the product page near the buy button.</p>
            </div>

            <div className="field admin-product-field-span-2">
              <label className="admin-checkbox-row">
                <input type="checkbox" name="featured" defaultChecked={product?.featured} />
                Featured on homepage
              </label>
            </div>
          </div>
        </div>
      </Section>

      <Section id="content" activeSection={activeSection} workspaceMode={workspaceMode}>
        <div className="admin-card admin-product-card">
          <p className="admin-field-hint admin-product-content-hint">
            Use the toolbar to format text, add headings, lists, links, and images. Existing
            Markdown content still displays on the shop — re-save to convert to rich text.
          </p>

          <div className="admin-content-tabs" role="tablist">
            {CONTENT_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={contentTab === tab.id}
                className={`admin-content-tab${contentTab === tab.id ? " active" : ""}`}
                onClick={() => setContentTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="admin-content-editor">
            <label className="admin-content-editor-label">
              {CONTENT_TABS.find((t) => t.id === contentTab)?.label}
              {contentTab === "description" ? " *" : ""}
            </label>
            <p className="admin-field-hint admin-content-tab-hint">
              {CONTENT_TABS.find((t) => t.id === contentTab)?.hint}
            </p>

            <AdminRichTextEditor
              key={contentTab}
              value={contentFields[contentTab]}
              onChange={(value) =>
                setContentFields((prev) => ({ ...prev, [contentTab]: value }))
              }
              minHeight={contentTab === "benefits" ? 280 : 420}
              placeholder={
                contentTab === "benefits"
                  ? "List key benefits — use bullet points or headings"
                  : "Write content for this tab…"
              }
            />
          </div>
        </div>
      </Section>

      <Section id="variants" activeSection={activeSection} workspaceMode={workspaceMode}>
        {product ? (
          <ProductVariantsEditor
            productId={product.id}
            productSlug={slug || product.slug}
            initialVariants={product.variants ?? []}
          />
        ) : (
          <div className="admin-card admin-product-card">
            <p className="admin-field-hint">
              Save the product basics first, then add variants &amp; SKUs.
            </p>
          </div>
        )}
      </Section>

      <Section id="offers" activeSection={activeSection} workspaceMode={workspaceMode}>
        <div className="admin-card admin-product-card">
          <div className="admin-offers-grid">
            <div className="admin-offers-block">
              <h3 className="admin-offers-title">Shipping for this product</h3>
              <p className="admin-field-hint">
                Choose shop-wide rules, or enable free shipping for this product only.
              </p>
              <label className="admin-checkbox-row">
                <input
                  type="checkbox"
                  name="use_shop_shipping"
                  checked={useShopShipping}
                  disabled={productFreeShipping}
                  onChange={(e) => {
                    setUseShopShipping(e.target.checked);
                    if (e.target.checked) setProductFreeShipping(false);
                  }}
                />
                <span>Use shop-wide shipping rules</span>
              </label>
              <label className="admin-checkbox-row" style={{ marginTop: 10 }}>
                <input
                  type="checkbox"
                  name="product_free_shipping"
                  checked={productFreeShipping}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setProductFreeShipping(checked);
                    if (checked) setUseShopShipping(false);
                  }}
                />
                <span>Free shipping on this product</span>
              </label>
            </div>

            <div className="admin-offers-block">
              <h3 className="admin-offers-title">Promotion for this product</h3>
              <p className="admin-field-hint">
                Shop-wide promo banner is set in Settings. Override here for a product-specific
                offer shown on this product&apos;s page.
              </p>
              <label className="admin-checkbox-row">
                <input
                  type="checkbox"
                  name="use_shop_promo"
                  defaultChecked={product?.use_shop_promo ?? true}
                />
                <span>Use shop-wide promotion</span>
              </label>
              <label className="admin-checkbox-row" style={{ marginTop: 10 }}>
                <input
                  type="checkbox"
                  name="promo_enabled"
                  defaultChecked={product?.promo_enabled ?? false}
                />
                <span>Enable custom product promotion</span>
              </label>
              <div className="field" style={{ marginTop: 16 }}>
                <label>Promo headline</label>
                <input
                  name="promo_headline"
                  defaultValue={product?.promo_headline ?? ""}
                  placeholder="e.g. Launch offer"
                />
              </div>
              <div className="field">
                <label>Promo message</label>
                <input
                  name="promo_message"
                  defaultValue={product?.promo_message ?? ""}
                  placeholder="e.g. Free delivery on this item"
                />
              </div>
              <div className="field">
                <label>Ends at (optional)</label>
                <input
                  type="datetime-local"
                  name="promo_ends_at"
                  defaultValue={toDatetimeLocal(product?.promo_ends_at)}
                />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {product && (
        <Section id="images" activeSection={activeSection} workspaceMode={workspaceMode}>
          <ProductImagesEditor
            productId={product.id}
            initialImages={product.images ?? []}
          />
          <ProductVideosEditor
            productId={product.id}
            initialVideos={product.videos ?? []}
          />
        </Section>
      )}

      {showActions && (
        <div className="admin-product-form-actions">
          <button type="submit" disabled={saving} className="admin-btn">
            {saving ? "Saving..." : product ? "Save changes" : "Create product"}
          </button>
          <Link href="/admin/products" className="admin-btn-ghost">
            Cancel
          </Link>
          {product && (
            <button
              type="button"
              onClick={handleDelete}
              className="admin-btn-danger"
              style={{ marginLeft: "auto" }}
            >
              Delete product
            </button>
          )}
        </div>
      )}
    </form>
  );
}
