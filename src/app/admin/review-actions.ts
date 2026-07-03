"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import type { ReviewStatus } from "@/lib/types";

function storagePathFromUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/review-images/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function deleteReviewImages(reviewId: string) {
  const service = createServiceClient();
  const { data: images } = await service
    .from("product_review_images")
    .select("image_url")
    .eq("review_id", reviewId);

  if (images?.length) {
    const paths = images
      .map((img) => storagePathFromUrl(img.image_url))
      .filter((p): p is string => Boolean(p));
    if (paths.length) {
      await service.storage.from("review-images").remove(paths);
    }
  }
}

export async function updateReviewStatus(
  reviewId: string,
  status: ReviewStatus,
  productSlug?: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_reviews")
    .update({ status })
    .eq("id", reviewId);

  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  if (productSlug) revalidatePath(`/products/${productSlug}`);
  return { success: true };
}

export async function toggleReviewFeatured(
  reviewId: string,
  featured: boolean,
  productSlug?: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_reviews")
    .update({ featured_on_homepage: featured })
    .eq("id", reviewId);

  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  if (productSlug) revalidatePath(`/products/${productSlug}`);
  return { success: true };
}

export async function deleteReview(reviewId: string, productSlug?: string) {
  await deleteReviewImages(reviewId);

  const supabase = await createClient();
  const { error } = await supabase
    .from("product_reviews")
    .delete()
    .eq("id", reviewId);

  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  if (productSlug) revalidatePath(`/products/${productSlug}`);
  return { success: true };
}
