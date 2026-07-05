import type { Metadata } from "next";
import {
  BRAND,
  CONTACT,
  SOCIAL_LINKS,
  WEBSITE_URL,
} from "@/lib/constants";
import type { ProductReviewSummary, ProductWithDetails } from "@/lib/types";

export const SEO_KEYWORDS = [
  "Safvane Naturals",
  "black seed oil Pakistan",
  "kalonji oil",
  "cold pressed black seed oil",
  "pure black seed oil",
  "Nigella sativa oil",
  "natural oils Pakistan",
  "organic black seed oil",
  "cold pressed kalonji oil",
  "wellness oils Pakistan",
  "Safvane black seed oil",
  "chemical free natural oil",
  "COD delivery Pakistan",
  "Attock natural products",
] as const;

const DEFAULT_OG_IMAGE = "/images/hero-black-seed-oil.png";

/** Canonical production URL — prefers Vercel/env override. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || WEBSITE_URL;
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path = ""): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildPageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  keywords = [...SEO_KEYWORDS],
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = image.startsWith("http") ? image : absoluteUrl(image);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: "website",
      locale: "en_PK",
      url,
      siteName: BRAND.name,
      title: `${title} | ${BRAND.name}`,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${BRAND.name} — ${title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${BRAND.name}`,
      description,
      images: [imageUrl],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${getSiteUrl()}/#organization`,
    name: CONTACT.company,
    alternateName: BRAND.name,
    url: getSiteUrl(),
    logo: absoluteUrl("/icons/safvane-icon.png"),
    description: BRAND.description,
    email: CONTACT.email,
    telephone: CONTACT.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Attock",
      addressCountry: "PK",
    },
    sameAs: SOCIAL_LINKS.map((l) => l.href),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: CONTACT.phone,
      contactType: "customer service",
      areaServed: "PK",
      availableLanguage: ["English", "Urdu"],
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${getSiteUrl()}/#website`,
    name: BRAND.name,
    url: getSiteUrl(),
    description: BRAND.description,
    publisher: { "@id": `${getSiteUrl()}/#organization` },
    inLanguage: "en-PK",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/shop")}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    "@id": `${getSiteUrl()}/#localbusiness`,
    name: BRAND.name,
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    url: getSiteUrl(),
    telephone: CONTACT.phone,
    email: CONTACT.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: CONTACT.address,
      addressLocality: "Attock",
      addressCountry: "PK",
    },
    priceRange: "PKR",
    currenciesAccepted: "PKR",
    paymentAccepted: "Cash",
    areaServed: {
      "@type": "Country",
      name: "Pakistan",
    },
  };
}

export function productJsonLd(
  product: ProductWithDetails,
  reviewSummary?: ProductReviewSummary
) {
  const images = product.images?.map((img) => img.image_url).filter(Boolean) ?? [];
  const prices = product.variants?.map((v) => Number(v.price)) ?? [];
  const inStock = product.variants?.some((v) => v.stock_status === "in_stock");

  const offers =
    product.variants?.map((v) => ({
      "@type": "Offer",
      name: v.variant_label,
      price: Number(v.price),
      priceCurrency: "PKR",
      availability: v.stock_status === "in_stock"
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: absoluteUrl(`/products/${product.slug}`),
      seller: { "@id": `${getSiteUrl()}/#organization` },
    })) ?? [];

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.meta_title ?? product.name,
    description:
      product.meta_description ??
      product.short_description ??
      product.description?.slice(0, 300),
    image: images.length ? images : [absoluteUrl(DEFAULT_OG_IMAGE)],
    sku: product.variants?.[0]?.sku ?? product.slug,
    brand: {
      "@type": "Brand",
      name: BRAND.name,
    },
    manufacturer: {
      "@type": "Organization",
      name: CONTACT.company,
    },
    offers:
      offers.length === 1
        ? offers[0]
        : {
            "@type": "AggregateOffer",
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            priceCurrency: "PKR",
            offerCount: offers.length,
            offers,
            availability: inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
    url: absoluteUrl(`/products/${product.slug}`),
  };

  if (reviewSummary && reviewSummary.count > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewSummary.averageRating,
      reviewCount: reviewSummary.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqPageJsonLd(
  items: { q: string; a: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export const DEFAULT_SITE_METADATA: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${BRAND.name} — Premium Cold-Pressed Black Seed Oil Pakistan`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    "Safvane Naturals — Pakistan's premium cold-pressed black seed (kalonji) oil. 100% pure, unrefined, chemical-free. Nationwide COD delivery. Shop authentic natural wellness oils.",
  keywords: [...SEO_KEYWORDS],
  authors: [{ name: CONTACT.company, url: getSiteUrl() }],
  creator: BRAND.name,
  publisher: CONTACT.company,
  formatDetection: { email: false, address: false, telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: { canonical: getSiteUrl() },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: getSiteUrl(),
    siteName: BRAND.name,
    title: `${BRAND.name} — Premium Cold-Pressed Black Seed Oil Pakistan`,
    description:
      "100% pure cold-pressed kalonji oil. Chemical-free, small-batch quality. Delivered across Pakistan with cash on delivery.",
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: `${BRAND.name} — Pure Cold-Pressed Black Seed Oil`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — Premium Cold-Pressed Black Seed Oil`,
    description: BRAND.description,
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
  category: "Health & Beauty",
};
