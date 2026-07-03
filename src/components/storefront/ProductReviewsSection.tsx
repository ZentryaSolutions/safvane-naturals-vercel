"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  BadgeCheck,
  Check,
  ImagePlus,
  Star,
  X,
} from "lucide-react";
import { submitProductReview } from "@/app/(storefront)/actions/reviews";
import type { ProductReview, ProductReviewSummary } from "@/lib/types";

const MAX_IMAGES = 4;

type SortKey = "recent" | "highest" | "lowest";

interface ProductReviewsSectionProps {
  productId: string;
  productSlug: string;
  productName: string;
  reviews: ProductReview[];
  summary: ProductReviewSummary;
  embedded?: boolean;
  requestOpenForm?: boolean;
  onRequestOpenFormHandled?: () => void;
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 18,
}: {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  return (
    <div
      className={`review-stars${readonly ? " review-stars-readonly" : ""}`}
      role={readonly ? "img" : "radiogroup"}
      aria-label={readonly ? `${value} out of 5 stars` : "Select rating"}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`review-star${star <= value ? " on" : ""}`}
          disabled={readonly}
          onClick={() => onChange?.(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            fill={star <= value ? "currentColor" : "none"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

function formatReviewDate(date: string) {
  return new Intl.DateTimeFormat("en-PK", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function sortReviews(reviews: ProductReview[], sort: SortKey) {
  const list = [...reviews];
  if (sort === "highest") {
    return list.sort((a, b) => b.rating - a.rating || Date.parse(b.created_at) - Date.parse(a.created_at));
  }
  if (sort === "lowest") {
    return list.sort((a, b) => a.rating - b.rating || Date.parse(b.created_at) - Date.parse(a.created_at));
  }
  return list.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export function ProductReviewsSection({
  productId,
  productSlug,
  productName,
  reviews,
  summary,
  embedded = false,
  requestOpenForm = false,
  onRequestOpenFormHandled,
}: ProductReviewsSectionProps) {
  const [rating, setRating] = useState(0);
  const [sort, setSort] = useState<SortKey>("recent");
  const [formOpen, setFormOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<{ file: File; url: string }[]>([]);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);

  const sortedReviews = useMemo(() => sortReviews(reviews, sort), [reviews, sort]);
  const maxDist = Math.max(...Object.values(summary.distribution), 1);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 7000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!requestOpenForm) return;
    setToast(null);
    setFormOpen(true);
    onRequestOpenFormHandled?.();
    requestAnimationFrame(() => {
      formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [requestOpenForm, onRequestOpenFormHandled]);

  const clearPreviews = () => {
    imagePreviews.forEach((p) => URL.revokeObjectURL(p.url));
    setImagePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeForm = () => {
    setFormOpen(false);
    setRating(0);
    clearPreviews();
  };

  const openForm = () => {
    setFormOpen(true);
    requestAnimationFrame(() => {
      formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next = [...imagePreviews];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (next.length >= MAX_IMAGES) break;
      next.push({ file, url: URL.createObjectURL(file) });
    }
    setImagePreviews(next);
  };

  const removePreview = (index: number) => {
    setImagePreviews((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].url);
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (rating < 1) {
      setToast({ type: "err", text: "Please select a star rating." });
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("product_id", productId);
    formData.set("product_slug", productSlug);
    formData.set("rating", String(rating));
    for (const { file } of imagePreviews) {
      formData.append("images", file);
    }

    startTransition(async () => {
      const result = await submitProductReview(formData);
      if (result.error) {
        setToast({ type: "err", text: result.error });
        return;
      }
      setToast({
        type: "ok",
        text: result.message ?? "Thank you! Your review has been submitted.",
      });
      form.reset();
      closeForm();
    });
  };

  const rootClass = embedded ? "pdp-reviews pdp-reviews--embedded" : "pdp-reviews";

  return (
    <div className={rootClass} aria-labelledby="reviews-heading">
      {toast && (
        <div
          className={`review-toast review-toast-${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="pdp-reviews-inner">
        <header className="pdp-reviews-hero">
          <div className="pdp-reviews-hero-grid">
            <div className="pdp-reviews-score-block">
              {summary.count > 0 ? (
                <>
                  <StarRating value={Math.round(summary.averageRating)} readonly size={20} />
                  <p className="pdp-reviews-score-line">
                    <strong>{summary.averageRating.toFixed(2)}</strong> out of 5
                  </p>
                  <p className="pdp-reviews-count-line">
                    <BadgeCheck size={14} aria-hidden />
                    {summary.count} verified review{summary.count !== 1 ? "s" : ""}
                  </p>
                </>
              ) : (
                <p className="pdp-reviews-first">
                  No reviews yet — be the first to share your experience.
                </p>
              )}
            </div>

            {summary.count > 0 && (
              <div className="pdp-reviews-distribution" aria-label="Rating distribution">
                {([5, 4, 3, 2, 1] as const).map((star) => (
                  <div key={star} className="pdp-reviews-dist-row">
                    <span className="pdp-reviews-dist-label">{star} ★</span>
                    <div className="pdp-reviews-dist-bar">
                      <span
                        style={{
                          width: `${(summary.distribution[star] / maxDist) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="pdp-reviews-dist-count">
                      {summary.distribution[star]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pdp-reviews-cta">
              {!formOpen && (
                <button type="button" className="btn review-write-btn" onClick={openForm}>
                  <span>Write a review</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {formOpen && (
          <div
            id="write-review"
            ref={formPanelRef}
            className="review-write-panel"
            aria-labelledby="write-review-title"
          >
            <div className="review-write-panel-head">
              <div>
                <h3 id="write-review-title">Write a review</h3>
                <p>Share your experience with {productName}</p>
              </div>
              <button
                type="button"
                className="review-write-panel-close"
                onClick={closeForm}
                aria-label="Close review form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="review-write-panel-stars">
              <span className="review-write-panel-stars-label">Your rating *</span>
              <StarRating value={rating} onChange={setRating} size={26} />
            </div>

            <form className="review-write-form" onSubmit={handleSubmit}>
              <div className="review-write-form-main">
                <div className="fg">
                  <label htmlFor="review_title">Review title</label>
                  <input
                    id="review_title"
                    name="review_title"
                    maxLength={120}
                    placeholder="Give your review a title"
                  />
                </div>

                <div className="fg">
                  <label htmlFor="review_text">Review content *</label>
                  <textarea
                    id="review_text"
                    name="review_text"
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={5}
                    placeholder="Tell others about quality, packaging, delivery, and results..."
                  />
                </div>
              </div>

              <div className="review-write-form-side">
                <div className="form-pair">
                  <div className="fg">
                    <label htmlFor="customer_name">Display name *</label>
                    <input
                      id="customer_name"
                      name="customer_name"
                      required
                      maxLength={80}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="fg">
                    <label htmlFor="customer_city">City</label>
                    <input
                      id="customer_city"
                      name="customer_city"
                      maxLength={80}
                      placeholder="e.g. Lahore"
                    />
                  </div>
                </div>

                <div className="fg">
                  <label htmlFor="customer_email">Email address</label>
                  <input
                    id="customer_email"
                    name="customer_email"
                    type="email"
                    maxLength={120}
                    placeholder="Optional — never shown publicly"
                  />
                </div>

                <div className="fg">
                  <span className="review-photo-label">Photos (optional)</span>
                  <div className="review-photo-strip">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="review-upload-input-hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    {imagePreviews.map((preview, index) => (
                      <div key={preview.url} className="review-upload-preview">
                        <Image
                          src={preview.url}
                          alt=""
                          width={72}
                          height={72}
                          unoptimized
                        />
                        <button
                          type="button"
                          className="review-upload-remove"
                          onClick={() => removePreview(index)}
                          aria-label="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {imagePreviews.length < MAX_IMAGES && (
                      <button
                        type="button"
                        className="review-upload-add"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus size={20} />
                        <span>Add photo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="review-write-form-foot">
                <p className="review-write-note">
                  Moderated before publishing · up to {MAX_IMAGES} photos
                </p>
                <div className="review-write-actions">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={closeForm}
                    disabled={pending}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn" disabled={pending}>
                    <span>{pending ? "Submitting..." : "Submit review"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {reviews.length > 0 ? (
          <div className="pdp-reviews-list-wrap">
            <div className="pdp-reviews-list-toolbar">
              <label className="pdp-reviews-sort">
                <span>Sort by</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label="Sort reviews"
                >
                  <option value="recent">Most recent</option>
                  <option value="highest">Highest rating</option>
                  <option value="lowest">Lowest rating</option>
                </select>
              </label>
            </div>

            <div className="pdp-reviews-list">
              {sortedReviews.map((review) => (
                <article key={review.id} className="review-card">
                  <div className="review-card-head">
                    <StarRating value={review.rating} readonly size={15} />
                    <time className="review-date" dateTime={review.created_at}>
                      {formatReviewDate(review.created_at)}
                    </time>
                  </div>

                  <div className="review-card-author">
                    <span className="review-avatar" aria-hidden>
                      {getInitials(review.customer_name)}
                    </span>
                    <div>
                      <div className="review-author-line">
                        <strong>{review.customer_name}</strong>
                        <span className="review-verified">
                          <BadgeCheck size={12} aria-hidden />
                          Verified
                        </span>
                      </div>
                      {review.customer_city && (
                        <span className="review-city">{review.customer_city}, Pakistan</span>
                      )}
                    </div>
                  </div>

                  {review.review_title && (
                    <h4 className="review-title">{review.review_title}</h4>
                  )}
                  <p className="review-text">{review.review_text}</p>

                  {review.images && review.images.length > 0 && (
                    <div className="review-images">
                      {review.images.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          className="review-image-thumb"
                          onClick={() => setLightboxUrl(img.image_url)}
                          aria-label="View customer photo"
                        >
                          <Image
                            src={img.image_url}
                            alt="Customer review photo"
                            width={88}
                            height={88}
                            sizes="88px"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        ) : (
          !formOpen && (
            <p className="pdp-reviews-empty-tab">
              No published reviews yet. Be the first to help others decide with confidence.
            </p>
          )
        )}
      </div>

      {lightboxUrl && (
        <div
          className="review-lightbox"
          role="presentation"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="review-lightbox-close"
            aria-label="Close"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={24} />
          </button>
          <Image
            src={lightboxUrl}
            alt="Customer review photo"
            width={900}
            height={900}
            className="review-lightbox-img"
            sizes="90vw"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
