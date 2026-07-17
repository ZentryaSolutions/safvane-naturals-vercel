import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/data";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  if (/localhost|127\.0\.0\.1/i.test(site)) {
    console.error("sitemap refused localhost base URL:", site);
  }

  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
      lastModified: new Date(),
    },
    {
      url: absoluteUrl("/shop"),
      changeFrequency: "daily",
      priority: 0.9,
      lastModified: new Date(),
    },
    {
      url: absoluteUrl("/about"),
      changeFrequency: "monthly",
      priority: 0.8,
      lastModified: new Date(),
    },
    {
      url: absoluteUrl("/faq"),
      changeFrequency: "monthly",
      priority: 0.7,
      lastModified: new Date(),
    },
    {
      url: absoluteUrl("/contact"),
      changeFrequency: "monthly",
      priority: 0.7,
      lastModified: new Date(),
    },
    {
      url: absoluteUrl("/track-order"),
      changeFrequency: "monthly",
      priority: 0.75,
      lastModified: new Date(),
    },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/products/${p.slug}`),
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.95,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: absoluteUrl(`/shop?category=${c.slug}`),
    changeFrequency: "weekly" as const,
    priority: 0.8,
    lastModified: new Date(),
  }));

  return [...staticPages, ...productPages, ...categoryPages].map((entry) => ({
    ...entry,
    url: entry.url.replace(/^http:\/\/localhost:\d+/i, getSiteUrl()),
  }));
}
