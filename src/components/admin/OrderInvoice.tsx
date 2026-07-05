import type { Order, OrderItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { BRAND, CONTACT, WEBSITE_URL } from "@/lib/constants";

interface OrderInvoiceProps {
  order: Order & { items: OrderItem[] };
}

function formatInvoiceDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Karachi",
  });
}

export function OrderInvoice({ order }: OrderInvoiceProps) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="order-invoice" id="order-invoice">
      <div className="order-invoice-title-row">
        <div>
          <p className="order-invoice-doc-label">Invoice</p>
          <p className="order-invoice-doc-number">{order.order_number}</p>
        </div>
        <div className="order-invoice-meta">
          <div className="order-invoice-meta-row">
            <span className="order-invoice-meta-label">Date</span>
            <span className="order-invoice-meta-value">
              {formatInvoiceDate(order.created_at)}
            </span>
          </div>
          <div className="order-invoice-meta-row">
            <span className="order-invoice-meta-label">Payment</span>
            <span className="order-invoice-meta-value">Cash on Delivery</span>
          </div>
          <div className="order-invoice-meta-row">
            <span className="order-invoice-meta-label">Items</span>
            <span className="order-invoice-meta-value">
              {itemCount} {itemCount === 1 ? "unit" : "units"}
            </span>
          </div>
        </div>
      </div>

      <section className="order-invoice-parties">
        <div className="order-invoice-party order-invoice-from">
          <h3>From</h3>
          <p className="order-invoice-party-name">{BRAND.name}</p>
          <p>{CONTACT.company}</p>
          <p>{CONTACT.address}</p>
          <p>
            {CONTACT.phoneDisplay} · {CONTACT.email}
          </p>
          <p>{WEBSITE_URL.replace(/^https?:\/\//, "")}</p>
          <p>CUIN: {CONTACT.cuin}</p>
        </div>
        <div className="order-invoice-party order-invoice-to">
          <h3>Ship to</h3>
          <p className="order-invoice-party-name">{order.customer_name}</p>
          <p>{order.customer_phone}</p>
          {order.customer_email && <p>{order.customer_email}</p>}
          <p>
            {order.delivery_address}
            <br />
            {order.city}, Pakistan
          </p>
        </div>
      </section>

      {order.order_note && (
        <p className="order-invoice-note">
          <strong>Note:</strong> {order.order_note}
        </p>
      )}

      <table className="order-invoice-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>Variant</th>
            <th className="order-invoice-num">Qty</th>
            <th className="order-invoice-num">Unit price</th>
            <th className="order-invoice-num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>{item.product_name_snapshot}</td>
              <td>{item.variant_label_snapshot}</td>
              <td className="order-invoice-num">{item.quantity}</td>
              <td className="order-invoice-num">
                {formatPrice(item.unit_price_snapshot)}
              </td>
              <td className="order-invoice-num">
                {formatPrice(item.unit_price_snapshot * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="order-invoice-summary">
        <div className="order-invoice-totals">
          <div>
            <span>Subtotal</span>
            <span>{formatPrice(Number(order.subtotal))}</span>
          </div>
          <div>
            <span>Shipping</span>
            <span>
              {Number(order.shipping_fee) === 0
                ? "FREE"
                : formatPrice(Number(order.shipping_fee))}
            </span>
          </div>
          <div className="order-invoice-total-row">
            <span>Total payable (COD)</span>
            <strong>{formatPrice(Number(order.total))}</strong>
          </div>
        </div>
      </div>

      <footer className="order-invoice-foot">
        <p>
          For order queries: {CONTACT.phoneDisplay} · {CONTACT.email} · Thank you
          for choosing {BRAND.name}.
        </p>
      </footer>
    </div>
  );
}
