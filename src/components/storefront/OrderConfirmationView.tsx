"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, MessageCircle, Package, Truck } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/types";

interface OrderConfirmationViewProps {
  order: (Order & { items: OrderItem[] }) | null;
  orderNumber: string;
}

export function OrderConfirmationView({
  order,
  orderNumber,
}: OrderConfirmationViewProps) {
  const [waUrl, setWaUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = sessionStorage.getItem("safvane-wa-url");
    if (url) {
      setWaUrl(url);
      sessionStorage.removeItem("safvane-wa-url");
    }
  }, []);

  if (!order) {
    return (
      <div className="order-confirm">
        <h1>Order not found</h1>
        <p style={{ color: "var(--dim)", marginBottom: 24 }}>
          We could not find order <strong>{orderNumber}</strong>. If you just placed
          an order, wait a moment and refresh.
        </p>
        <Link href="/shop" className="btn">
          <span>Continue Shopping</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="order-confirm">
      <div className="order-confirm-success" role="status" aria-live="polite">
        <CheckCircle2 size={56} className="order-confirm-icon" aria-hidden />
        <h1>
          Order <em>placed successfully</em>
        </h1>
        <p className="order-confirm-lead">
          Thank you, <strong>{order.customer_name}</strong>. Your order has been
          received and is being prepared.
        </p>
      </div>

      <div className="order-box">
        <p className="order-box-label">ORDER NUMBER</p>
        <p className="order-box-number">{order.order_number}</p>

        {order.items?.map((item) => (
          <div key={item.id} className="sr">
            <span>
              {item.product_name_snapshot} ({item.variant_label_snapshot}) ×{" "}
              {item.quantity}
            </span>
            <span>{formatPrice(item.unit_price_snapshot * item.quantity)}</span>
          </div>
        ))}

        <div className="sr">
          <span>Shipping</span>
          <span>
            {Number(order.shipping_fee) === 0
              ? "FREE"
              : formatPrice(Number(order.shipping_fee))}
          </span>
        </div>

        <div className="sr total">
          <span>Total (Cash on Delivery)</span>
          <strong>{formatPrice(Number(order.total))}</strong>
        </div>
      </div>

      <div className="order-confirm-steps">
        <div className="order-confirm-step">
          <Package size={20} aria-hidden />
          <div>
            <strong>We&apos;re preparing your order</strong>
            <p>You&apos;ll get a call or WhatsApp to confirm delivery details.</p>
          </div>
        </div>
        <div className="order-confirm-step">
          <Truck size={20} aria-hidden />
          <div>
            <strong>Pay on delivery</strong>
            <p>
              Keep Rs. {Number(order.total).toLocaleString()} ready when your parcel
              arrives.
            </p>
          </div>
        </div>
      </div>

      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="order-confirm-wa"
        >
          <MessageCircle size={18} aria-hidden />
          Send order details on WhatsApp
        </a>
      )}

      <Link href="/shop" className="btn order-confirm-cta">
        <span>Continue Shopping</span>
      </Link>
    </div>
  );
}
