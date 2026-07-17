"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Loader2, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSyncedCartShipping } from "@/hooks/useSyncedCartShipping";
import { formatPrice } from "@/lib/utils";
import {
  calculateShippingFee,
  freeShippingAmountNeeded,
} from "@/lib/shipping";
import type { SiteSettings } from "@/lib/types";
import type { CheckoutInput } from "@/lib/validations";
import { markOrderPlaced } from "@/components/storefront/OrderConfirmationView";
import {
  stashMetaPurchase,
  trackMetaInitiateCheckout,
} from "@/lib/meta-pixel";

type ShippingSettings = Pick<
  SiteSettings,
  "flat_shipping_fee" | "free_shipping_enabled" | "free_shipping_minimum"
>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, stockIssues, removeItem, updateQuantity } = useCart();
  const shippingItems = useSyncedCartShipping(items);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const placingOrder = useRef(false);
  const initiateCheckoutTracked = useRef(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [form, setForm] = useState<Omit<CheckoutInput, "customer_name">>({
    customer_phone: "",
    customer_email: "",
    delivery_address: "",
    city: "",
    order_note: "",
  });
  const [area, setArea] = useState("");

  useEffect(() => {
    if (redirecting || placingOrder.current) return;
    if (items.length === 0) router.replace("/cart");
  }, [items.length, router, redirecting]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setShippingSettings(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initiateCheckoutTracked.current || items.length === 0) return;
    initiateCheckoutTracked.current = true;
    trackMetaInitiateCheckout({
      value: subtotal,
      currency: "PKR",
      contents: items.map((i) => ({
        id: i.productId,
        quantity: i.quantity,
        item_price: i.price,
      })),
      content_ids: items.map((i) => i.productId),
      content_type: "product",
      num_items: items.reduce((sum, i) => sum + i.quantity, 0),
    });
  }, [items, subtotal]);

  const shippingFee = calculateShippingFee(subtotal, shippingSettings, shippingItems);
  const total = subtotal + shippingFee;
  const hasStockIssues = stockIssues.length > 0;
  const canPlaceOrder =
    items.length > 0 && !hasStockIssues && !loading && !redirecting;
  const amountForFreeShipping = freeShippingAmountNeeded(subtotal, shippingSettings);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const handleRemoveItem = (variantId: string) => {
    if (loading || redirecting) return;
    removeItem(variantId);
  };

  const handleUpdateQuantity = (variantId: string, quantity: number) => {
    if (loading || redirecting) return;
    updateQuantity(variantId, quantity);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPlaceOrder || items.length === 0) return;
    placingOrder.current = true;
    setLoading(true);
    setErrors({});
    setFormError("");

    const customer_name = `${firstName.trim()} ${lastName.trim()}`.trim();
    const delivery_address = area.trim()
      ? `${form.delivery_address.trim()}, ${area.trim()}`
      : form.delivery_address.trim();

    const payload: CheckoutInput = {
      customer_name,
      customer_phone: form.customer_phone,
      customer_email: form.customer_email,
      delivery_address,
      city: form.city,
      order_note: form.order_note,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          cartItems: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        placingOrder.current = false;
        if (data.error && typeof data.error === "object") {
          setErrors(data.error);
        } else {
          setFormError(data.error ?? "Checkout failed");
        }
        setLoading(false);
        return;
      }

      setRedirecting(true);
      stashMetaPurchase({
        value: Number(data.total ?? total),
        currency: "PKR",
        contents: items.map((i) => ({
          id: i.productId,
          quantity: i.quantity,
          item_price: i.price,
        })),
        content_ids: items.map((i) => i.productId),
        content_type: "product",
        num_items: itemCount,
        order_id: data.orderNumber || undefined,
        event_id: data.eventId || undefined,
        user: {
          email: form.customer_email || undefined,
          phone: form.customer_phone,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          city: form.city || undefined,
          country: "pk",
          externalId: data.orderNumber || form.customer_phone,
        },
      });
      markOrderPlaced();
      router.replace("/order-confirmation");
    } catch {
      placingOrder.current = false;
      setFormError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (!redirecting && items.length === 0) return null;

  const summaryBody = (
    <>
      <ul className="checkout-items">
        {items.map((item) => (
          <li key={item.variantId} className="checkout-item">
            <div className="checkout-item-img">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.productName}
                  width={64}
                  height={64}
                  className="checkout-item-photo"
                />
              ) : (
                <div className="checkout-item-photo checkout-item-placeholder" />
              )}
            </div>
            <div className="checkout-item-info">
              <p className="checkout-item-name">{item.productName}</p>
              <p className="checkout-item-meta">{item.variantLabel}</p>
              <div className="checkout-item-qty">
                <div className="mini-step">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateQuantity(item.variantId, item.quantity - 1)
                    }
                    disabled={loading || redirecting}
                    aria-label={`Decrease quantity of ${item.productName}`}
                  >
                    −
                  </button>
                  <span className="mv">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateQuantity(
                        item.variantId,
                        Math.min(item.stockQuantity, item.quantity + 1)
                      )
                    }
                    disabled={
                      loading ||
                      redirecting ||
                      item.quantity >= item.stockQuantity
                    }
                    aria-label={`Increase quantity of ${item.productName}`}
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="checkout-item-price">
                {formatPrice(item.price * item.quantity)}
              </p>
              {item.quantity >= item.stockQuantity && (
                <p className="checkout-item-stock-hint">Max available</p>
              )}
            </div>
            <button
              type="button"
              className="checkout-item-remove"
              onClick={() => handleRemoveItem(item.variantId)}
              disabled={loading || redirecting}
              aria-label={`Remove ${item.productName} from order`}
            >
              <X size={16} aria-hidden />
              <span>Remove</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="checkout-totals">
        <div className="sr">
          <span>Subtotal ({itemCount} item{itemCount === 1 ? "" : "s"})</span>
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
        <div className="sr total">
          <span>Total</span>
          <strong>{formatPrice(total)}</strong>
        </div>
      </div>

      {amountForFreeShipping !== null && shippingFee > 0 && (
        <p className="checkout-shipping-hint">
          Add {formatPrice(amountForFreeShipping)} more for free shipping
        </p>
      )}
    </>
  );

  return (
    <div className="checkout-page">
      <div className="checkout-page-inner">
        <nav className="checkout-crumb" aria-label="Breadcrumb">
          <Link href="/shop">Shop</Link>
          <span aria-hidden>→</span>
          <Link href="/cart">Cart</Link>
          <span aria-hidden>→</span>
          <span>Checkout</span>
        </nav>

        <header className="checkout-header">
          <h1>Checkout</h1>
          <p>Enter your details to place your order.</p>
        </header>

        <div className="checkout-wrap">
          <div className="checkout-l">
            <form onSubmit={handleSubmit} className="checkout-form">
              {hasStockIssues && (
                <div className="stock-warn">
                  Some items have stock issues. Please update your cart before
                  placing an order.
                </div>
              )}
              {formError && <div className="stock-warn">{formError}</div>}

              <section className="checkout-card">
                <h2 className="checkout-section-title">Contact</h2>
                <div className="form-pair">
                  <div className="fg">
                    <label htmlFor="first-name">First name *</label>
                    <input
                      id="first-name"
                      required
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ahmad"
                    />
                  </div>
                  <div className="fg">
                    <label htmlFor="last-name">Last name *</label>
                    <input
                      id="last-name"
                      required
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Khan"
                    />
                  </div>
                </div>
                <div className="fg full">
                  <label htmlFor="phone">Phone *</label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="03XX XXXXXXX"
                    value={form.customer_phone}
                    onChange={(e) =>
                      setForm({ ...form, customer_phone: e.target.value })
                    }
                  />
                  {errors.customer_phone && (
                    <span className="field-error">{errors.customer_phone[0]}</span>
                  )}
                </div>
                <div className="fg full">
                  <label htmlFor="email">Email (optional)</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={form.customer_email}
                    onChange={(e) =>
                      setForm({ ...form, customer_email: e.target.value })
                    }
                    placeholder="For order updates"
                  />
                  {errors.customer_email && (
                    <span className="field-error">
                      {errors.customer_email[0]}
                    </span>
                  )}
                </div>
                {errors.customer_name && (
                  <span className="field-error">{errors.customer_name[0]}</span>
                )}
              </section>

              <section className="checkout-card">
                <h2 className="checkout-section-title">Delivery</h2>
                <div className="fg full">
                  <label htmlFor="address">Address *</label>
                  <input
                    id="address"
                    required
                    autoComplete="street-address"
                    value={form.delivery_address}
                    onChange={(e) =>
                      setForm({ ...form, delivery_address: e.target.value })
                    }
                    placeholder="House no., street, landmark"
                  />
                  {errors.delivery_address && (
                    <span className="field-error">{errors.delivery_address[0]}</span>
                  )}
                </div>
                <div className="form-pair">
                  <div className="fg">
                    <label htmlFor="city">City *</label>
                    <input
                      id="city"
                      required
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="Attock"
                    />
                    {errors.city && (
                      <span className="field-error">{errors.city[0]}</span>
                    )}
                  </div>
                  <div className="fg">
                    <label htmlFor="area">Area (optional)</label>
                    <input
                      id="area"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g. Saddar"
                    />
                  </div>
                </div>
                <div className="fg full">
                  <label htmlFor="note">Order note (optional)</label>
                  <input
                    id="note"
                    value={form.order_note}
                    onChange={(e) =>
                      setForm({ ...form, order_note: e.target.value })
                    }
                    placeholder="Gate code, preferred time, etc."
                  />
                </div>
              </section>

              <section className="checkout-card checkout-payment-card">
                <h2 className="checkout-section-title">Payment</h2>
                <div className="checkout-payment-option" aria-current="true">
                  <span>Cash on Delivery (COD)</span>
                </div>
              </section>

              <button
                type="submit"
                className="btn checkout-submit-btn"
                disabled={!canPlaceOrder}
              >
                <span>
                  {loading || redirecting
                    ? "Placing order…"
                    : items.length === 0
                      ? "Cart is empty"
                      : `Place order · ${formatPrice(total)}`}
                </span>
              </button>

              <Link href="/cart" className="checkout-back-link">
                ← Back to cart
              </Link>
            </form>
          </div>

          <aside className={`checkout-r${summaryOpen ? " is-open" : ""}`}>
            <div className="checkout-summary-card">
              <button
                type="button"
                className="checkout-summary-toggle"
                onClick={() => setSummaryOpen((open) => !open)}
                aria-expanded={summaryOpen}
              >
                <span className="checkout-summary-toggle-left">
                  Order summary
                  <ChevronDown
                    size={18}
                    className={`checkout-summary-chevron${summaryOpen ? " open" : ""}`}
                    aria-hidden
                  />
                </span>
                <span className="checkout-summary-toggle-total">
                  {formatPrice(total)}
                </span>
              </button>

              <h3 className="checkout-summary-title">Order Summary</h3>
              <div className="checkout-summary-body">{summaryBody}</div>
            </div>
          </aside>
        </div>
      </div>

      {(loading || redirecting) && (
        <div className="checkout-placing-overlay" role="status" aria-live="polite">
          <div className="checkout-placing-card">
            <Loader2 size={40} className="checkout-placing-spinner" aria-hidden />
            <h2>Placing your order…</h2>
            <p>Please wait — do not close this page.</p>
          </div>
        </div>
      )}
    </div>
  );
}
