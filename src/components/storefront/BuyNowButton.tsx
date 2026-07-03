"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { PLACEHOLDER_IMAGE } from "@/lib/utils";
import type { ProductVariant, ProductWithDetails } from "@/lib/types";

interface BuyNowButtonProps {
  variant: ProductVariant;
  product: ProductWithDetails;
  quantity?: number;
  className?: string;
}

export function BuyNowButton({
  variant,
  product,
  quantity = 1,
  className = "",
}: BuyNowButtonProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const outOfStock = variant.stock_status === "out_of_stock";

  const handleClick = () => {
    if (outOfStock) return;
    addItem({
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      variantLabel: variant.variant_label,
      price: Number(variant.price),
      imageUrl: product.images[0]?.image_url ?? PLACEHOLDER_IMAGE,
      stockQuantity: variant.stock_quantity,
      stockStatus: variant.stock_status,
      slug: product.slug,
      quantity,
      useShopShipping: product.use_shop_shipping ?? true,
      productFreeShipping: product.product_free_shipping ?? false,
    });
    router.push("/checkout");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={outOfStock}
      className={`btn btn-buy-now ${className}`.trim()}
    >
      <span>Buy Now</span>
    </button>
  );
}
