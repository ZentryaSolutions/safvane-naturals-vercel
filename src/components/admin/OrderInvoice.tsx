import type { Order, OrderItem } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { BRAND } from "@/lib/constants";

interface OrderInvoiceProps {
  order: Order & { items: OrderItem[] };
}

export function OrderInvoice({ order }: OrderInvoiceProps) {
  return (
    <div className="order-invoice" id="order-invoice">
      <header className="order-invoice-head">
        <div>
          <p className="order-invoice-brand">{BRAND.name}</p>
          <p className="order-invoice-sub">Packing slip & COD invoice</p>
        </div>
        <div className="order-invoice-meta">
          <p>
            <strong>{order.order_number}</strong>
          </p>
          <p>{new Date(order.created_at).toLocaleString("en-PK")}</p>
          <p className="order-invoice-status">Status: {order.status}</p>
        </div>
      </header>

      <section className="order-invoice-section">
        <h3>Deliver to</h3>
        <p className="order-invoice-customer-name">{order.customer_name}</p>
        <p>{order.customer_phone}</p>
        {order.customer_email && <p>{order.customer_email}</p>}
        <p>
          {order.delivery_address}, {order.city}
        </p>
        {order.order_note && (
          <p className="order-invoice-note">
            <strong>Note:</strong> {order.order_note}
          </p>
        )}
      </section>

      <table className="order-invoice-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>
                {item.product_name_snapshot}
                <span className="order-invoice-variant"> ({item.variant_label_snapshot})</span>
              </td>
              <td>{item.quantity}</td>
              <td>{formatPrice(item.unit_price_snapshot)}</td>
              <td>{formatPrice(item.unit_price_snapshot * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

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
          <span>Total (COD)</span>
          <strong>{formatPrice(Number(order.total))}</strong>
        </div>
      </div>

      <footer className="order-invoice-foot">
        <p>Payment: Cash on Delivery — collect Rs. {Number(order.total).toLocaleString()} from customer.</p>
        <p>Place this slip inside the parcel for courier (TCS / rider) reference.</p>
      </footer>
    </div>
  );
}
