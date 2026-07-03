import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getProductReviews,
  getProductReviewSummary,
  getProducts,
  getSiteSettings,
} from "@/lib/data";
import { ProductDetailClient } from "@/components/storefront/ProductDetailClient";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.meta_title ?? product.name,
    description:
      product.meta_description ?? product.short_description ?? undefined,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [all, reviews, reviewSummary, shippingSettings] = await Promise.all([
    getProducts(),
    getProductReviews(product.id),
    getProductReviewSummary(product.id),
    getSiteSettings(),
  ]);
  const related = all.filter((p) => p.id !== product.id);

  return (
    <ProductDetailClient
      product={product}
      related={related}
      reviews={reviews}
      reviewSummary={reviewSummary}
      shippingSettings={shippingSettings}
    />
  );
}
