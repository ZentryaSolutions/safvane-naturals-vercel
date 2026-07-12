import { unstable_noStore as noStore } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  Category,
  ProductReview,
  ProductReviewSummary,
  ProductVariant,
  ProductWithDetails,
  SiteSettings,
} from "@/lib/types";

const productSelect = `
  *,
  category:categories(*),
  variants:product_variants(*),
  images:product_images(*),
  videos:product_videos(*)
`;

export async function getSiteSettings(): Promise<SiteSettings | null> {
  noStore();
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) console.error("getSiteSettings:", error.message);
  return data;
}

export async function getCategories(): Promise<Category[]> {
  noStore();
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) console.error("getCategories:", error.message);
  return data ?? [];
}

export async function getFeaturedProducts(): Promise<ProductWithDetails[]> {
  return getProducts({ featured: true, limit: 6 });
}

export async function getProducts(options?: {
  categorySlug?: string;
  featured?: boolean;
  limit?: number;
}): Promise<ProductWithDetails[]> {
  noStore();
  const supabase = createPublicClient();

  let query = supabase
    .from("products")
    .select(productSelect)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (options?.featured) {
    query = query.eq("featured", true);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data: products, error } = await query;

  if (error) {
    console.error("getProducts:", error.message);
    return [];
  }

  if (!products?.length) return [];

  let filtered = products as ProductWithDetails[];

  if (options?.categorySlug) {
    filtered = filtered.filter((p) => p.category?.slug === options.categorySlug);
  }

  return filtered.map(enrichProduct);
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithDetails | null> {
  noStore();
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error) {
    console.error("getProductBySlug:", error.message);
    return null;
  }

  return enrichProduct(data as ProductWithDetails);
}

function enrichProduct(product: ProductWithDetails): ProductWithDetails {
  return {
    ...product,
    variants: [...(product.variants ?? [])].sort(
      (a, b) => Number(a.price) - Number(b.price)
    ),
    images: [...(product.images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
    videos: [...(product.videos ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  };
}

export async function getVariantById(
  variantId: string
): Promise<
  (ProductVariant & { product: { name: string; slug: string; status: string } }) | null
> {
  noStore();
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("product_variants")
    .select(`*, product:products(name, slug, status)`)
    .eq("id", variantId)
    .single();
  return data;
}

export async function getVariantsByIds(variantIds: string[]) {
  noStore();
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("product_variants")
    .select(
      `
      *,
      product:products(id, name, slug, status),
      images:product_images(image_url, sort_order)
    `
    )
    .in("id", variantIds);

  return data ?? [];
}

export async function getProductReviews(
  productId: string
): Promise<ProductReview[]> {
  noStore();
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select(`*, images:product_review_images(id, review_id, image_url, sort_order)`)
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProductReviews:", error.message);
    return [];
  }

  return (data ?? []).map((review) => ({
    ...review,
    images: [...(review.images ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  }));
}

function emptyDistribution(): Record<1 | 2 | 3 | 4 | 5, number> {
  return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
}

export async function getProductReviewSummary(
  productId: string
): Promise<ProductReviewSummary> {
  const reviews = await getProductReviews(productId);
  if (!reviews.length) {
    return { averageRating: 0, count: 0, distribution: emptyDistribution() };
  }

  const distribution = emptyDistribution();
  let total = 0;
  for (const review of reviews) {
    total += review.rating;
    const star = review.rating as 1 | 2 | 3 | 4 | 5;
    if (star >= 1 && star <= 5) distribution[star] += 1;
  }

  return {
    averageRating: Math.round((total / reviews.length) * 100) / 100,
    count: reviews.length,
    distribution,
  };
}

export async function getFeaturedHomeReviews(limit = 6) {
  noStore();
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select(`*, product:products(name, slug)`)
    .eq("status", "approved")
    .eq("featured_on_homepage", true)
    .order("rating", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedHomeReviews:", error.message);
    return [];
  }

  return data ?? [];
}
