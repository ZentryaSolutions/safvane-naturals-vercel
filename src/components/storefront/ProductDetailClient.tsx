"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AddToCartButton } from "@/components/storefront/AddToCartButton";
import { BuyNowButton } from "@/components/storefront/BuyNowButton";
import { ProductImageZoom } from "@/components/storefront/ProductImageZoom";
import { ProductMediaFrame } from "@/components/storefront/ProductMediaFrame";
import { RichTextContent } from "@/components/storefront/RichTextContent";
import { appendBenefitsToContent } from "@/lib/rich-content";
import { FreeShippingBadge } from "@/components/storefront/FreeShippingBadge";
import { productHasActivePromo, productShowsFreeShipping } from "@/lib/shipping";
import { ShopProductCard } from "@/components/storefront/ShopProductCard";
import { WhatsAppButton } from "@/components/storefront/WhatsAppButton";
import { ProductReviewsSection } from "@/components/storefront/ProductReviewsSection";
import {
  formatPrice,
  getWhatsAppLink,
  PLACEHOLDER_IMAGE,
} from "@/lib/utils";
import {
  DEFAULT_DELIVERY_RETURNS,
  CONTACT,
  getWhatsAppOrderMessage,
  WHATSAPP_DEFAULT_MESSAGE,
  WHATSAPP_NUMBER,
} from "@/lib/constants";
import type { ProductReview, ProductReviewSummary, ProductWithDetails, SiteSettings } from "@/lib/types";

interface ProductDetailClientProps {
  product: ProductWithDetails;
  related?: ProductWithDetails[];
  reviews: ProductReview[];
  reviewSummary: ProductReviewSummary;
  shippingSettings?: Pick<
    SiteSettings,
    "flat_shipping_fee" | "free_shipping_enabled" | "free_shipping_minimum"
  > | null;
}

type DetailTab = "details" | "use" | "ingredients" | "shipping" | "reviews";

const TABS: { id: DetailTab; label: string }[] = [
  { id: "details", label: "Product Details" },
  { id: "use", label: "How to Use" },
  { id: "ingredients", label: "Ingredients" },
  { id: "shipping", label: "Delivery & Returns" },
  { id: "reviews", label: "Customer Reviews" },
];

export function ProductDetailClient({
  product,
  related = [],
  reviews,
  reviewSummary,
  shippingSettings = null,
}: ProductDetailClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants.find((v) => v.stock_status === "in_stock")?.id ??
      product.variants[0]?.id ??
      ""
  );
  const [quantity, setQuantity] = useState(1);
  const [activeMedia, setActiveMedia] = useState(0);
  const [tab, setTab] = useState<DetailTab>("details");
  const [openReviewForm, setOpenReviewForm] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#reviews") {
      setTab("reviews");
    }
  }, []);

  const selectedVariant = product.variants.find(
    (v) => v.id === selectedVariantId
  );

  type GalleryItem =
    | { type: "image"; id: string; src: string; alt: string }
    | { type: "video"; id: string; src: string; poster?: string | null };

  const gallery: GalleryItem[] = [
    ...(product.images.length > 0
      ? product.images.map((img) => ({
          type: "image" as const,
          id: img.id,
          src: img.image_url,
          alt: img.alt_text ?? product.name,
        }))
      : [
          {
            type: "image" as const,
            id: "ph",
            src: PLACEHOLDER_IMAGE,
            alt: product.name,
          },
        ]),
    ...(product.videos ?? []).map((v) => ({
      type: "video" as const,
      id: v.id,
      src: v.video_url,
      poster: v.poster_url,
    })),
  ];

  const active = gallery[Math.min(activeMedia, gallery.length - 1)] ?? gallery[0];
  const hasMultipleVariants = product.variants.length > 1;
  const maxQty = selectedVariant?.stock_quantity ?? 1;

  if (!selectedVariant) return null;

  const comparePrice = selectedVariant.compare_at_price
    ? Number(selectedVariant.compare_at_price)
    : null;
  const savePct =
    comparePrice && comparePrice > Number(selectedVariant.price)
      ? Math.round((1 - Number(selectedVariant.price) / comparePrice) * 100)
      : null;

  const lineTotal = formatPrice(Number(selectedVariant.price) * quantity);
  const whatsappHelpUrl = getWhatsAppLink(
    WHATSAPP_NUMBER,
    WHATSAPP_DEFAULT_MESSAGE
  );

  const productDetailsContent = appendBenefitsToContent(
    product.description ?? "",
    product.benefits
  );
  const showProductPromo = productHasActivePromo(product);
  const showFreeShipping = productShowsFreeShipping(
    product,
    shippingSettings,
    Number(selectedVariant.price)
  );

  const goToReviews = (openForm = false) => {
    setTab("reviews");
    if (openForm) setOpenReviewForm(true);
    window.history.replaceState(null, "", "#reviews");
    requestAnimationFrame(() => {
      document.getElementById("product-tabs")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <div className="pdp-page">
      <div className="pdp-top">
        <div className="pdp-gallery-col">
          <div className="pdp-gallery">
            {gallery.length > 1 && (
              <div className="pdp-thumbs-vertical">
                {gallery.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`pdp-thumb-v${activeMedia === i ? " on" : ""}${item.type === "video" ? " is-video" : ""}`}
                    onClick={() => setActiveMedia(i)}
                    aria-label={
                      item.type === "video"
                        ? `Play video ${i + 1}`
                        : `View image ${i + 1}`
                    }
                  >
                    {item.type === "video" ? (
                      <span className="pdp-thumb-video">
                        <video
                          src={item.src}
                          muted
                          playsInline
                          preload="metadata"
                          aria-hidden
                        />
                        <span className="pdp-thumb-play" aria-hidden>
                          ▶
                        </span>
                      </span>
                    ) : (
                      <ProductMediaFrame
                        src={item.src}
                        alt={item.alt}
                        variant="thumb"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}

            {active?.type === "video" ? (
              <div className="pdp-video-stage">
                <video
                  key={active.id}
                  className="pdp-video-player"
                  src={active.src}
                  poster={active.poster ?? undefined}
                  controls
                  playsInline
                  preload="metadata"
                  controlsList="nodownload"
                >
                  Your browser does not support video playback.
                </video>
              </div>
            ) : (
              <ProductImageZoom
                src={active?.src ?? PLACEHOLDER_IMAGE}
                alt={active?.type === "image" ? active.alt : product.name}
                priority
                onSwipeLeft={() =>
                  setActiveMedia((i) => Math.min(gallery.length - 1, i + 1))
                }
                onSwipeRight={() => setActiveMedia((i) => Math.max(0, i - 1))}
              />
            )}
          </div>
        </div>

        <div className="pdp-buy-col">
          <div className="pdp-buy-sticky">
            <div className="pdp-crumb">
              <Link href="/shop">Shop</Link>
              <span>/</span>
              <span>{product.category?.name}</span>
              <span>/</span>
              <span>{product.name}</span>
            </div>

            <span className="pdp-tag">
              {product.category?.name} · Cold Pressed · COD Nationwide
            </span>

            <h1 className="pdp-title">{product.name}</h1>

            <div className="pdp-rating-row">
              {reviewSummary.count > 0 ? (
                <>
                  <span className="pdp-rating-score">
                    {reviewSummary.averageRating.toFixed(1)}
                  </span>
                  <span className="pdp-rating-stars" aria-hidden>
                    {"★".repeat(Math.round(reviewSummary.averageRating))}
                    {"☆".repeat(5 - Math.round(reviewSummary.averageRating))}
                  </span>
                  <button
                    type="button"
                    className="pdp-rating-link"
                    onClick={() => goToReviews(false)}
                  >
                    {reviewSummary.count} review{reviewSummary.count !== 1 ? "s" : ""}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="pdp-rating-link"
                  onClick={() => goToReviews(true)}
                >
                  Write the first review
                </button>
              )}
            </div>

            <div className="pdp-price-row">
              <div className="pdp-price">
                {formatPrice(Number(selectedVariant.price))}
              </div>
              {comparePrice && (
                <div className="pdp-was">{formatPrice(comparePrice)}</div>
              )}
              {savePct && <div className="pdp-save">Save {savePct}%</div>}
              {showFreeShipping && <FreeShippingBadge variant="pdp" />}
            </div>

            <p className="pdp-desc">
              {product.short_description ??
                "Premium cold-pressed natural oil — bottled fresh, delivered with cash on delivery."}
            </p>

            {showProductPromo && (
              <div className="pdp-product-promo">
                {product.promo_headline && (
                  <strong>{product.promo_headline}</strong>
                )}
                {product.promo_message && <span>{product.promo_message}</span>}
              </div>
            )}

            {hasMultipleVariants && (
              <div className="pdp-variant-block">
                <span className="pdp-var-label">Select Size</span>
                <div className="pdp-variants">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className={`v-opt${
                        selectedVariantId === v.id ? " on" : ""
                      }${v.stock_status === "out_of_stock" ? " sold" : ""}`}
                      disabled={v.stock_status === "out_of_stock"}
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setQuantity(1);
                      }}
                    >
                      {v.variant_label}
                      {v.stock_status === "out_of_stock" ? " — Sold out" : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedVariant.stock_status === "in_stock" && (
              <div className="pdp-qty">
                <div className="stepper">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="sv">{quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.min(maxQty, q + 1))
                    }
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <div className="stock-ok">
                  In stock · {maxQty} available
                </div>
              </div>
            )}

            <div className="pdp-acts">
              {selectedVariant.stock_status === "in_stock" ? (
                <>
                  <div className="pdp-acts-row">
                    <AddToCartButton
                      variant={selectedVariant}
                      product={product}
                      quantity={quantity}
                      label={`Add to Cart — ${lineTotal}`}
                    />
                    <BuyNowButton
                      variant={selectedVariant}
                      product={product}
                      quantity={quantity}
                    />
                  </div>
                  <WhatsAppButton
                    message={getWhatsAppOrderMessage(
                      product.name,
                      selectedVariant.variant_label,
                      lineTotal,
                      quantity
                    )}
                    label="Order on WhatsApp"
                    className="btn-wa btn-wa-block"
                  />
                </>
              ) : (
                <button type="button" className="btn" disabled>
                  Out of Stock
                </button>
              )}
            </div>

            <div className="pdp-trust-strip">
              <div className="pdp-trust-item">
                <strong>COD</strong>
                <span>Cash on delivery</span>
              </div>
              <div className="pdp-trust-item">
                <strong>100%</strong>
                <span>Pure & natural</span>
              </div>
              <div className="pdp-trust-item">
                <strong>WhatsApp</strong>
                <span>Fast support</span>
              </div>
            </div>

            <div className="pdp-wa-card">
              <div>
                <div className="pdp-wa-title">Need help choosing?</div>
                <p>Chat with us on WhatsApp for sizing, usage, and delivery questions.</p>
              </div>
              <Link
                href={whatsappHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="pdp-wa-link"
              >
                {CONTACT.phoneDisplay}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <section className="pdp-details-full" id="product-tabs">
        <div className="pdp-details-inner">
          <div className="pdp-details-tabs" role="tablist">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={`pdp-details-tab${tab === id ? " on" : ""}`}
                onClick={() => setTab(id)}
              >
                {label}
                {id === "reviews" && reviewSummary.count > 0 && (
                  <span className="pdp-tab-count">{reviewSummary.count}</span>
                )}
              </button>
            ))}
          </div>

          <div className="pdp-details-panel" role="tabpanel">
            {tab === "details" && (
              <>
                {productDetailsContent.trim() ? (
                  <RichTextContent content={productDetailsContent} />
                ) : (
                  <p className="pdp-details-empty">
                    Detailed product information will be added soon.
                  </p>
                )}
              </>
            )}

            {tab === "use" && (
              product.how_to_use?.trim() ? (
                <RichTextContent content={product.how_to_use} />
              ) : (
                <p className="pdp-details-empty">
                  Usage instructions will be added soon.
                </p>
              )
            )}

            {tab === "ingredients" && (
              product.ingredients?.trim() ? (
                <RichTextContent content={product.ingredients} />
              ) : (
                <p className="pdp-details-empty">
                  Ingredient information will be added soon.
                </p>
              )
            )}

            {tab === "shipping" && (
              <RichTextContent
                content={product.delivery_returns?.trim() || DEFAULT_DELIVERY_RETURNS}
              />
            )}

            {tab === "reviews" && (
              <ProductReviewsSection
                embedded
                productId={product.id}
                productSlug={product.slug}
                productName={product.name}
                reviews={reviews}
                summary={reviewSummary}
                requestOpenForm={openReviewForm}
                onRequestOpenFormHandled={() => setOpenReviewForm(false)}
              />
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <div className="related-wrap">
          <div className="related-head">
            <h2>
              You may also <em>like</em>
            </h2>
          </div>
          <div className="shop-grid">
            {related.slice(0, 3).map((p) => (
              <ShopProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
