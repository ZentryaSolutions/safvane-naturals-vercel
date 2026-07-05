import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getProductReviews,
  getProductReviewSummary,
  getProducts,
  getSiteSettings,
} from "@/lib/data";
import { ProductDetailClient } from "@/components/storefront/ProductDetailClient";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  productJsonLd,
} from "@/lib/seo";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found", robots: { index: false } };

  const title =
    product.meta_title ??
    `${product.name} — Cold-Pressed Black Seed Oil`;
  const description =
    product.meta_description ??
    product.short_description ??
    `Buy ${product.name} by Safvane Naturals. 100% pure cold-pressed oil with nationwide COD delivery in Pakistan.`;

  const image = product.images?.[0]?.image_url ?? undefined;

  return buildPageMetadata({
    title,
    description,
    path: `/products/${slug}`,
    image,
    keywords: [
      product.name,
      "Safvane Naturals",
      "black seed oil Pakistan",
      "kalonji oil",
      "cold pressed oil",
    ],
  });
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
    <>
      <JsonLd
        data={[
          productJsonLd(product, reviewSummary),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            { name: product.name, path: `/products/${product.slug}` },
          ]),
        ]}
      />
      <ProductDetailClient
        product={product}
        related={related}
        reviews={reviews}
        reviewSummary={reviewSummary}
        shippingSettings={shippingSettings}
      />
    </>
  );
}
