"use client";

import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { updateOrderStatus } from "@/app/admin/actions";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import { OrderInvoice } from "@/components/admin/OrderInvoice";
import type { Order, OrderItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

interface OrderDetailClientProps {
  order: Order & { items: OrderItem[] };
}

export function OrderDetailClient({ order }: OrderDetailClientProps) {
  const router = useRouter();
  const { showToast } = useAdminToast();

  const handleStatusChange = async (status: string) => {
    const result = await updateOrderStatus(order.id, status);
    if (result.error) showToast("error", result.error);
    else showToast("success", `Order status updated to ${status}`);
    router.refresh();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="order-admin-detail">
      <div className="no-print">
        <Link href="/admin/orders" style={{ fontSize: "0.8125rem", color: "#71717a" }}>
          ← Back to orders
        </Link>

        <div className="admin-header-row" style={{ marginTop: 16 }}>
          <div>
            <h1 className="admin-page-title">{order.order_number}</h1>
            <p className="admin-page-sub">
              {new Date(order.created_at).toLocaleString("en-PK")}
            </p>
          </div>
          <div className="admin-order-actions">
            <button type="button" className="admin-btn" onClick={handlePrint}>
              <Printer size={16} />
              Print packing slip
            </button>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="admin-order-status-select"
            >
              {["new", "processing", "shipped", "delivered", "cancelled"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginBottom: 32 }}>
          <div className="admin-card">
            <h2 className="admin-section-title">Customer</h2>
            <dl style={{ fontSize: "0.875rem" }}>
              <div style={{ marginBottom: 12 }}>
                <dt style={{ color: "#71717a" }}>Name</dt>
                <dd style={{ fontWeight: 500 }}>{order.customer_name}</dd>
              </div>
              <div style={{ marginBottom: 12 }}>
                <dt style={{ color: "#71717a" }}>Phone</dt>
                <dd style={{ fontWeight: 500 }}>{order.customer_phone}</dd>
              </div>
              {order.customer_email && (
                <div style={{ marginBottom: 12 }}>
                  <dt style={{ color: "#71717a" }}>Email</dt>
                  <dd>{order.customer_email}</dd>
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <dt style={{ color: "#71717a" }}>Address</dt>
                <dd>
                  {order.delivery_address}, {order.city}
                </dd>
              </div>
              {order.order_note && (
                <div>
                  <dt style={{ color: "#71717a" }}>Note</dt>
                  <dd>{order.order_note}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="admin-card">
            <h2 className="admin-section-title">Order summary</h2>
            <ul className="admin-divider-list">
              {order.items.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.product_name_snapshot} ({item.variant_label_snapshot}) ×{" "}
                    {item.quantity}
                  </span>
                  <span style={{ fontWeight: 500 }}>
                    {formatPrice(item.unit_price_snapshot * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #e4e4e7", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span>Subtotal</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span>Shipping</span>
                <span>
                  {Number(order.shipping_fee) === 0
                    ? "FREE"
                    : formatPrice(Number(order.shipping_fee))}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: "1rem" }}>
                <span>Total (COD)</span>
                <span>{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="order-invoice-print-area">
        <OrderInvoice order={order} />
      </div>
    </div>
  );
}
