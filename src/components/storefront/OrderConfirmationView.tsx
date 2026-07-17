"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { consumeMetaPurchase, trackMetaPurchase } from "@/lib/meta-pixel";

const ORDER_PLACED_KEY = "safvane-order-placed";

export function OrderConfirmationView() {
  const { clearCart } = useCart();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Ensure confirmation starts at top (mobile checkout scroll can linger)
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Fire Purchase on confirmation page load (once per completed checkout)
    const purchase = consumeMetaPurchase();
    if (purchase) {
      trackMetaPurchase(purchase);
    }

    if (sessionStorage.getItem(ORDER_PLACED_KEY)) {
      clearCart();
      sessionStorage.removeItem(ORDER_PLACED_KEY);
    }
    sessionStorage.removeItem("safvane-wa-url");
    sessionStorage.removeItem("safvane-order-email");
    setReady(true);
  }, [clearCart]);

  if (!ready) return null;

  return (
    <div className="order-confirm">
      <div className="order-confirm-success" role="status" aria-live="polite">
        <CheckCircle2 size={56} className="order-confirm-icon" aria-hidden />
        <h1>
          Order <em>placed successfully</em>
        </h1>
        <p className="order-confirm-lead">
          Thank you for your order. We have received it and will be in touch
          soon. Once your parcel ships, use the PostEx tracking ID on our Track
          Order page anytime.
        </p>
      </div>

      <div className="order-confirm-actions">
        <Link href="/track-order" className="btn order-confirm-cta">
          <span>Track order</span>
        </Link>
        <Link href="/shop" className="btn-ghost order-confirm-secondary">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

export function markOrderPlaced() {
  sessionStorage.setItem(ORDER_PLACED_KEY, "1");
}
