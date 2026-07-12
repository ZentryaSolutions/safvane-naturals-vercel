"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductMediaFrame } from "@/components/storefront/ProductMediaFrame";
import { FreeShippingBadge } from "@/components/storefront/FreeShippingBadge";
import { useCart } from "@/context/CartContext";
import { useSyncedCartShipping } from "@/hooks/useSyncedCartShipping";
import { formatPrice } from "@/lib/utils";
import { calculateShippingFee, freeShippingLabel, productShowsFreeShipping } from "@/lib/shipping";
import type { SiteSettings } from "@/lib/types";

export default function CartPage() {
  const { items, subtotal, removeItem, updateQuantity, stockIssues } =
    useCart();
  const shippingItems = useSyncedCartShipping(items);
  const [shippingSettings, setShippingSettings] = useState<
    Pick<SiteSettings, "flat_shipping_fee" | "free_shipping_enabled" | "free_shipping_minimum"> | null
  >(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setShippingSettings(d))
      .catch(() => {});
  }, []);

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h1>Your Cart is Empty</h1>
        <p>Explore our collection of pure, cold-pressed natural oils.</p>
        <Link href="/shop" className="btn">
          <span>Shop Now</span>
        </Link>
      </div>
    );
  }

  const hasStockIssues = stockIssues.length > 0;
  const shippingFee = calculateShippingFee(subtotal, shippingSettings, shippingItems);
  const total = subtotal + shippingFee;

  return (
    <div className="cart-wrap">
      <div className="cart-l">
        <h1>Your Cart</h1>
        <div className="cart-l-sub">
          {items.reduce((s, i) => s + i.quantity, 0)} item
          {items.length !== 1 ? "s" : ""}
        </div>

        {hasStockIssues && (
          <div className="stock-warn">
            Some items have stock issues. Please update your cart before
            checkout.
          </div>
        )}

        {items.map((item) => (
          <div key={item.variantId} className="ci-row">
            <div className="ci-img">
              <ProductMediaFrame
                src={item.imageUrl}
                alt={item.productName}
                variant="thumb"
              />
            </div>
            <div className="ci-info">
              <div className="ci-name">{item.productName}</div>
              <div className="ci-var">Size: {item.variantLabel}</div>
              <div className="ci-meta">
                {(item.productFreeShipping ||
                  productShowsFreeShipping(
                    {
                      use_shop_shipping: item.useShopShipping,
                      product_free_shipping: item.productFreeShipping,
                    },
                    shippingSettings,
                    subtotal
                  )) && (
                  <FreeShippingBadge variant="cart" className="ci-free-ship" />
                )}
                <button
                  type="button"
                  className="ci-del"
                  onClick={() => removeItem(item.variantId)}
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="ci-right">
              <div className="ci-total">
                {formatPrice(item.price * item.quantity)}
              </div>
              <div className="mini-step">
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(item.variantId, item.quantity - 1)
                  }
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="mv">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    updateQuantity(
                      item.variantId,
                      Math.min(item.stockQuantity, item.quantity + 1)
                    )
                  }
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-r">
        <h3>Order Summary</h3>
        <div className="sr">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="sr">
          <span>Shipping</span>
          <span>
            {shippingFee === 0 ? (
              <span className="shipping-free">FREE</span>
            ) : (
              formatPrice(shippingFee)
            )}
          </span>
        </div>
        {shippingSettings?.free_shipping_enabled && shippingFee > 0 && (
          <p className="shipping-hint">{freeShippingLabel(shippingSettings)}</p>
        )}
        <div className="sr total">
          <span>Total</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        <div className="cod-block">
          <div className="cod-tag">Cash on Delivery</div>
          <p>
            No payment required now. Pay in cash when your order arrives at your
            door.
          </p>
        </div>
        <ul className="trust-list">
          <li className="tr-item">
            <Check size={14} strokeWidth={2.5} aria-hidden />
            Secure, private checkout
          </li>
          <li className="tr-item">
            <Check size={14} strokeWidth={2.5} aria-hidden />
            Pakistan-wide COD delivery
          </li>
          <li className="tr-item">
            <Check size={14} strokeWidth={2.5} aria-hidden />
            100% pure, genuine products
          </li>
        </ul>
        {hasStockIssues ? (
          <button
            type="button"
            className="btn cart-checkout-btn"
            disabled
          >
            <span>Resolve stock issues</span>
          </button>
        ) : (
          <Link href="/checkout" className="btn cart-checkout-btn">
            <span>Proceed to Checkout</span>
          </Link>
        )}
      </div>
    </div>
  );
}
