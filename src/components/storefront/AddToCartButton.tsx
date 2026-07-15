"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { trackMetaAddToCart } from "@/lib/meta-pixel";
import { PLACEHOLDER_IMAGE } from "@/lib/utils";
import type { ProductVariant, ProductWithDetails } from "@/lib/types";

interface AddToCartButtonProps {
  variant: ProductVariant;
  product: ProductWithDetails;
  quantity?: number;
  className?: string;
  label?: string;
}

export function AddToCartButton({
  variant,
  product,
  quantity = 1,
  className = "",
  label,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const outOfStock = variant.stock_status === "out_of_stock";

  const handleClick = () => {
    if (outOfStock) return;
    const price = Number(variant.price);
    addItem({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      variantLabel: variant.variant_label,
      price,
      imageUrl: product.images[0]?.image_url ?? PLACEHOLDER_IMAGE,
      stockQuantity: variant.stock_quantity,
      stockStatus: variant.stock_status,
      slug: product.slug,
      quantity,
      useShopShipping: product.use_shop_shipping ?? true,
      productFreeShipping: product.product_free_shipping ?? false,
    });
    trackMetaAddToCart({
      value: price * quantity,
      currency: "PKR",
      contents: [
        {
          id: product.id,
          quantity,
          item_price: price,
        },
      ],
      content_ids: [product.id],
      content_type: "product",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={outOfStock}
      className={`btn ${className}`}
      style={outOfStock ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
    >
      <span>
        {added
          ? "Added to Cart!"
          : outOfStock
            ? "Out of Stock"
            : label ?? "Add to Cart"}
      </span>
    </button>
  );
}
