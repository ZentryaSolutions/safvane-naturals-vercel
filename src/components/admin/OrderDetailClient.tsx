"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Pencil,
  Printer,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { deleteOrder, updateOrder } from "@/app/admin/actions";
import { OrderCommunicationsPanel } from "@/components/admin/OrderCommunicationsPanel";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface OrderDetailClientProps {
  order: Order & { items: OrderItem[] };
  communications?: Array<{
    id: string;
    channel: string;
    template_id: string;
    recipient: string | null;
    created_at: string;
  }>;
}

const STATUS_OPTIONS: OrderStatus[] = [
  "new",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function statusLabel(status: OrderStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  });
}

export function OrderDetailClient({
  order: initialOrder,
  communications = [],
}: OrderDetailClientProps) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [order, setOrder] = useState(initialOrder);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    customer_name: initialOrder.customer_name,
    customer_phone: initialOrder.customer_phone,
    customer_email: initialOrder.customer_email ?? "",
    delivery_address: initialOrder.delivery_address,
    city: initialOrder.city,
    order_note: initialOrder.order_note ?? "",
    status: initialOrder.status,
    shipping_fee: Number(initialOrder.shipping_fee),
  });

  useEffect(() => {
    setOrder(initialOrder);
    setForm({
      customer_name: initialOrder.customer_name,
      customer_phone: initialOrder.customer_phone,
      customer_email: initialOrder.customer_email ?? "",
      delivery_address: initialOrder.delivery_address,
      city: initialOrder.city,
      order_note: initialOrder.order_note ?? "",
      status: initialOrder.status,
      shipping_fee: Number(initialOrder.shipping_fee),
    });
  }, [initialOrder]);

  const computedTotal = Number(order.subtotal) + form.shipping_fee;

  const handleSave = async () => {
    if (!form.customer_name.trim() || !form.customer_phone.trim()) {
      showToast("error", "Customer name and phone are required.");
      return;
    }
    if (!form.delivery_address.trim() || !form.city.trim()) {
      showToast("error", "Delivery address and city are required.");
      return;
    }

    setSaving(true);
    const result = await updateOrder(order.id, {
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_email: form.customer_email || null,
      delivery_address: form.delivery_address,
      city: form.city,
      order_note: form.order_note || null,
      status: form.status,
      shipping_fee: form.shipping_fee,
    });

    if ("error" in result && result.error) {
      showToast("error", result.error);
      setSaving(false);
      return;
    }

    showToast("success", "Order updated");
    setEditing(false);
    setSaving(false);
    router.refresh();
  };

  const handleCancelEdit = () => {
    setForm({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email ?? "",
      delivery_address: order.delivery_address,
      city: order.city,
      order_note: order.order_note ?? "",
      status: order.status,
      shipping_fee: Number(order.shipping_fee),
    });
    setEditing(false);
  };

  const openDeleteModal = () => {
    setDeleteStep(1);
    setDeleteConfirmText("");
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep(1);
    setDeleteConfirmText("");
  };

  const handleDelete = async () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }

    setDeleting(true);
    const result = await deleteOrder(order.id, deleteConfirmText);
    if ("error" in result && result.error) {
      showToast("error", result.error);
      setDeleting(false);
      return;
    }

    showToast("success", "Order deleted permanently");
    router.push("/admin/orders");
  };

  const handlePrint = () => {
    window.open(`/admin/orders/${order.id}/print`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="order-admin-detail">
      <Link href="/admin/orders" className="admin-order-back">
        ← Back to orders
      </Link>

      <div className="admin-order-header">
        <div>
          <div className="admin-order-header-top">
            <h1 className="admin-page-title">{order.order_number}</h1>
            <span className={`admin-order-status-badge status-${order.status}`}>
              {statusLabel(order.status)}
            </span>
          </div>
          <p className="admin-page-sub">
            Placed {formatDateTime(order.created_at)}
          </p>
        </div>
        <div className="admin-order-actions">
          {!editing ? (
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={() => setEditing(true)}
            >
              <Pencil size={16} />
              Edit order
            </button>
          ) : (
            <>
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                <X size={16} />
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? "Saving…" : "Save changes"}
              </button>
            </>
          )}
          <button type="button" className="admin-btn" onClick={handlePrint}>
            <Printer size={16} />
            Print invoice
          </button>
        </div>
      </div>

      <div className="admin-order-layout">
        <section className="admin-card admin-order-section">
          <h2 className="admin-section-title">Order status</h2>
          {editing ? (
            <div className="admin-form admin-order-form-grid">
              <div className="field">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as OrderStatus,
                    }))
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Shipping fee (PKR)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.shipping_fee}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      shipping_fee: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          ) : (
            <dl className="admin-order-dl">
              <div>
                <dt>Status</dt>
                <dd className={`admin-order-status-text status-${order.status}`}>
                  {statusLabel(order.status)}
                </dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>Cash on Delivery (COD)</dd>
              </div>
              <div>
                <dt>Shipping fee</dt>
                <dd>
                  {Number(order.shipping_fee) === 0
                    ? "FREE"
                    : formatPrice(Number(order.shipping_fee))}
                </dd>
              </div>
              <div>
                <dt>Order total</dt>
                <dd className="admin-order-total-value">
                  {formatPrice(Number(order.total))}
                </dd>
              </div>
            </dl>
          )}
          {editing && (
            <p className="admin-field-hint admin-order-edit-hint">
              Changing status to <strong>Cancelled</strong> restores product stock.
              Shipping fee updates recalculate the COD total.
            </p>
          )}
        </section>

        <section className="admin-card admin-order-section">
          <h2 className="admin-section-title">Customer &amp; delivery</h2>
          {editing ? (
            <div className="admin-form admin-order-form-grid">
              <div className="field">
                <label>Full name *</label>
                <input
                  value={form.customer_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_name: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>Phone *</label>
                <input
                  value={form.customer_phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_phone: e.target.value }))
                  }
                />
              </div>
              <div className="field admin-order-form-full">
                <label>Email</label>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer_email: e.target.value }))
                  }
                />
              </div>
              <div className="field admin-order-form-full">
                <label>Street address *</label>
                <input
                  value={form.delivery_address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, delivery_address: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>City *</label>
                <input
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                />
              </div>
              <div className="field admin-order-form-full">
                <label>Order note</label>
                <textarea
                  rows={3}
                  value={form.order_note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, order_note: e.target.value }))
                  }
                />
              </div>
            </div>
          ) : (
            <dl className="admin-order-dl">
              <div>
                <dt>Name</dt>
                <dd>{order.customer_name}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{order.customer_phone}</dd>
              </div>
              {order.customer_email && (
                <div>
                  <dt>Email</dt>
                  <dd>{order.customer_email}</dd>
                </div>
              )}
              <div>
                <dt>Address</dt>
                <dd>
                  {order.delivery_address}, {order.city}, Pakistan
                </dd>
              </div>
              {order.order_note && (
                <div>
                  <dt>Customer note</dt>
                  <dd>{order.order_note}</dd>
                </div>
              )}
            </dl>
          )}
        </section>

        <section className="admin-card admin-order-section admin-order-section-wide">
          <h2 className="admin-section-title">Line items</h2>
          <div className="admin-order-items-table-wrap">
            <table className="admin-order-items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Qty</th>
                  <th>Unit price</th>
                  <th>Line total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name_snapshot}</td>
                    <td>{item.variant_label_snapshot}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPrice(item.unit_price_snapshot)}</td>
                    <td>
                      {formatPrice(item.unit_price_snapshot * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-order-totals-panel">
            <div>
              <span>Subtotal</span>
              <span>{formatPrice(Number(order.subtotal))}</span>
            </div>
            <div>
              <span>Shipping</span>
              <span>
                {editing
                  ? form.shipping_fee === 0
                    ? "FREE"
                    : formatPrice(form.shipping_fee)
                  : Number(order.shipping_fee) === 0
                    ? "FREE"
                    : formatPrice(Number(order.shipping_fee))}
              </span>
            </div>
            <div className="admin-order-totals-grand">
              <span>Total (COD)</span>
              <strong>
                {formatPrice(editing ? computedTotal : Number(order.total))}
              </strong>
            </div>
          </div>
          <p className="admin-field-hint" style={{ marginTop: 12 }}>
            Line items are locked after checkout. Edit customer details, status, or
            shipping above if needed.
          </p>
        </section>

        <OrderCommunicationsPanel
          order={order}
          communications={communications}
        />

        <section className="admin-card admin-order-section admin-order-danger-zone">
          <h2 className="admin-section-title admin-order-danger-title">
            <AlertTriangle size={18} />
            Danger zone
          </h2>
          <p className="admin-field-hint">
            Permanently delete this order and all its line items. Stock is restored
            automatically unless the order was already cancelled. This cannot be
            undone.
          </p>
          <button
            type="button"
            className="admin-btn-danger"
            onClick={openDeleteModal}
          >
            <Trash2 size={16} />
            Delete order permanently
          </button>
        </section>
      </div>

      {showDeleteModal && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal admin-order-delete-modal">
            {deleteStep === 1 ? (
              <>
                <h3>Delete order {order.order_number}?</h3>
                <p>
                  This will permanently remove the order, packing slip record, and
                  all line items. Product stock will be restored if the order is
                  not already cancelled.
                </p>
                <div className="admin-modal-actions">
                  <button
                    type="button"
                    className="admin-btn-ghost"
                    onClick={closeDeleteModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="admin-btn-danger"
                    onClick={handleDelete}
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Type order number to confirm</h3>
                <p>
                  Type <strong>{order.order_number}</strong> exactly to confirm
                  permanent deletion.
                </p>
                <input
                  className="admin-order-delete-input"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={order.order_number}
                  autoFocus
                />
                <div className="admin-modal-actions">
                  <button
                    type="button"
                    className="admin-btn-ghost"
                    onClick={closeDeleteModal}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="admin-btn-danger"
                    onClick={handleDelete}
                    disabled={
                      deleting || deleteConfirmText.trim() !== order.order_number
                    }
                  >
                    {deleting ? "Deleting…" : "Delete permanently"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
