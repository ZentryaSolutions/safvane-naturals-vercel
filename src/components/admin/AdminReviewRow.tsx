"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Home, Trash2, X } from "lucide-react";
import {
  deleteReview,
  toggleReviewFeatured,
  updateReviewStatus,
} from "@/app/admin/review-actions";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import type { ProductReview } from "@/lib/types";

interface ReviewRowProps {
  review: ProductReview & {
    product?: { name: string; slug: string } | null;
  };
}

export function AdminReviewRow({ review }: ReviewRowProps) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [loading, setLoading] = useState(false);
  const productSlug = review.product?.slug;
  const featured = review.featured_on_homepage ?? false;

  const run = async (
    action: () => Promise<{ error?: string }>,
    successMessage: string
  ) => {
    setLoading(true);
    const result = await action();
    if (result.error) showToast("error", result.error);
    else showToast("success", successMessage);
    router.refresh();
    setLoading(false);
  };

  return (
    <tr>
      <td>
        <div style={{ fontWeight: 500, color: "#18181b" }}>
          {review.product?.name ?? "—"}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#71717a" }}>
          {review.product?.slug}
        </div>
      </td>
      <td>
        <div style={{ fontWeight: 500 }}>{review.customer_name}</div>
        {review.customer_city && (
          <div style={{ fontSize: "0.75rem", color: "#71717a" }}>
            {review.customer_city}
          </div>
        )}
        {review.customer_email && (
          <div style={{ fontSize: "0.75rem", color: "#71717a" }}>
            {review.customer_email}
          </div>
        )}
      </td>
      <td>
        <span className="review-stars-inline" aria-label={`${review.rating} stars`}>
          {"★".repeat(review.rating)}
          <span style={{ color: "#d4d4d8" }}>{"★".repeat(5 - review.rating)}</span>
        </span>
      </td>
      <td style={{ maxWidth: 360, fontSize: "0.875rem", lineHeight: 1.5 }}>
        {review.review_title && (
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{review.review_title}</div>
        )}
        <div>{review.review_text}</div>
        {review.images && review.images.length > 0 && (
          <div className="admin-review-images">
            {review.images.map((img) => (
              <a
                key={img.id}
                href={img.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-review-image-thumb"
              >
                <Image
                  src={img.image_url}
                  alt="Review photo"
                  width={48}
                  height={48}
                  sizes="48px"
                />
              </a>
            ))}
          </div>
        )}
      </td>
      <td>
        <span className={`admin-badge admin-badge-${review.status === "approved" ? "active" : review.status === "pending" ? "draft" : "hidden"}`}>
          {review.status}
        </span>
      </td>
      <td>
        {review.status === "approved" && review.featured_on_homepage ? (
          <span className="admin-badge admin-badge-active">Featured</span>
        ) : (
          <span style={{ color: "#a1a1aa", fontSize: "0.75rem" }}>—</span>
        )}
      </td>
      <td style={{ fontSize: "0.8125rem", color: "#71717a", whiteSpace: "nowrap" }}>
        {new Date(review.created_at).toLocaleDateString()}
      </td>
      <td>
        <div className="admin-review-actions">
          {review.status === "approved" && (
            <button
              type="button"
              className={`admin-icon-btn${featured ? " admin-icon-btn-featured" : ""}`}
              disabled={loading}
              title={featured ? "Remove from homepage" : "Show on homepage"}
              onClick={() =>
                run(
                  () => toggleReviewFeatured(review.id, !featured, productSlug),
                  featured ? "Removed from homepage" : "Review featured on homepage"
                )
              }
            >
              <Home size={14} />
            </button>
          )}
          {review.status !== "approved" && (
            <button
              type="button"
              className="admin-icon-btn admin-icon-btn-ok"
              disabled={loading}
              title="Approve"
              onClick={() =>
                run(
                  () => updateReviewStatus(review.id, "approved", productSlug),
                  "Review approved"
                )
              }
            >
              <Check size={14} />
            </button>
          )}
          {review.status !== "rejected" && (
            <button
              type="button"
              className="admin-icon-btn"
              disabled={loading}
              title="Reject"
              onClick={() =>
                run(
                  () => updateReviewStatus(review.id, "rejected", productSlug),
                  "Review rejected"
                )
              }
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            className="admin-icon-btn admin-icon-btn-danger"
            disabled={loading}
            title="Delete"
            onClick={() => {
              if (!confirm("Delete this review permanently?")) return;
              run(() => deleteReview(review.id, productSlug), "Review deleted");
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
