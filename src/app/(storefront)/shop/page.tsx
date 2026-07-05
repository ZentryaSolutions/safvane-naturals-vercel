import Link from "next/link";
import type { Metadata } from "next";
import { getCategories, getProducts } from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";
import { ShopProductCard } from "@/components/storefront/ShopProductCard";
import { Reveal } from "@/components/ui/Reveal";

interface ShopPageProps {
  searchParams: Promise<{ category?: string }>;
}

export async function generateMetadata({
  searchParams,
}: ShopPageProps): Promise<Metadata> {
  const { category: categorySlug } = await searchParams;
  if (categorySlug) {
    return buildPageMetadata({
      title: `Shop ${categorySlug.replace(/-/g, " ")} — Natural Oils`,
      description: `Browse Safvane Naturals ${categorySlug.replace(/-/g, " ")}. Cold-pressed, pure, chemical-free oils with cash on delivery across Pakistan.`,
      path: `/shop?category=${categorySlug}`,
    });
  }
  return buildPageMetadata({
    title: "Shop Pure Cold-Pressed Natural Oils",
    description:
      "Browse Safvane Naturals collection — premium cold-pressed black seed oil and natural wellness products. COD delivery nationwide.",
    path: "/shop",
  });
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category: categorySlug } = await searchParams;
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug }),
  ]);

  return (
    <>
      <div className="shop-hero">
        <Reveal>
          <h1>
            <em>The Collection</em>
          </h1>
          <p>
            Cold-pressed, unrefined, and bottled without chemicals or shortcuts
            — across our growing range of natural oils.
          </p>
        </Reveal>
      </div>

      <div className="shop-bar">
        <div className="pills">
          <Link
            href="/shop"
            className={`pill${!categorySlug ? " on" : ""}`}
          >
            All Products
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className={`pill${categorySlug === cat.slug ? " on" : ""}`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="shop-body">
        {products.length > 0 ? (
          <div className="shop-grid">
            {products.map((product) => (
              <ShopProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h1>No products yet</h1>
            <p>
              Products will appear here once added from the admin panel.
            </p>
            <Link href="/" className="btn-ghost">
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
