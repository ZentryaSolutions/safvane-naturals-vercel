import { ProductMediaFrame } from "@/components/storefront/ProductMediaFrame";
import { formatPrice, getLowestVariantPrice } from "@/lib/utils";
import type { ProductWithDetails } from "@/lib/types";
import Link from "next/link";
import { AddToCartButton } from "./AddToCartButton";

interface ShopProductCardProps {
  product: ProductWithDetails;
  onClick?: () => void;
}

function ProductCardTags({
  featured,
  allOutOfStock,
}: {
  featured?: boolean;
  allOutOfStock?: boolean;
}) {
  const hasTags = featured || allOutOfStock;
  if (!hasTags) return null;

  return (
    <div className="product-card-tags">
      {featured && <div className="product-card-tag">Featured</div>}
      {allOutOfStock && <div className="product-card-tag">Out of Stock</div>}
    </div>
  );
}

export function ShopProductCard({ product }: ShopProductCardProps) {
  const lowestPrice = getLowestVariantPrice(product.variants);
  const hasMultipleVariants = product.variants.length > 1;
  const allOutOfStock = product.variants.every(
    (v) => v.stock_status === "out_of_stock"
  );

  return (
    <Link href={`/products/${product.slug}`} className="sgcard">
      <div className="sgcard-img">
        <ProductCardTags featured={product.featured} allOutOfStock={allOutOfStock} />
        <ProductMediaFrame
          src={product.images[0]?.image_url}
          alt={product.images[0]?.alt_text ?? product.name}
          variant="card"
        />
      </div>
      <div className="sgcard-body">
        <div className="sgcard-cat">{product.category?.name ?? "Natural Oils"}</div>
        <h3>{product.name}</h3>
        <div className="sgcard-desc">
          {product.short_description ?? product.description.slice(0, 90)}
        </div>
        <div className="sgcard-foot">
          <div className="sgcard-price">
            {lowestPrice !== null ? (
              hasMultipleVariants ? (
                <>From {formatPrice(lowestPrice)}</>
              ) : (
                formatPrice(lowestPrice)
              )
            ) : (
              "—"
            )}
          </div>
          <div className="sgcard-cta">View Product →</div>
        </div>
      </div>
    </Link>
  );
}

export function HorizontalProductCard({ product }: ShopProductCardProps) {
  const lowestPrice = getLowestVariantPrice(product.variants);

  return (
    <Link href={`/products/${product.slug}`} className="hcard">
      <div className="hcard-img">
        <ProductCardTags featured={product.featured} />
        <ProductMediaFrame
          src={product.images[0]?.image_url}
          alt={product.name}
          variant="horizontal"
        />
      </div>
      <div className="hcard-body">
        <div className="hcard-cat">{product.category?.name ?? "Natural Oils"}</div>
        <h3>{product.name}</h3>
        <div className="hcard-excerpt">
          {(product.short_description ?? product.description).slice(0, 80)}…
        </div>
        <div className="hcard-foot">
          <div className="hcard-price">
            {lowestPrice !== null ? formatPrice(lowestPrice) : "—"}
          </div>
          <div className="hcard-add">+</div>
        </div>
      </div>
    </Link>
  );
}

export { AddToCartButton };
