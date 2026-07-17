import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data: orders } = await query;
  const statuses = ["new", "processing", "shipped", "delivered", "cancelled"];

  return (
    <div>
      <h1 className="admin-page-title">Orders</h1>
      <p className="admin-page-sub">Manage customer orders</p>

      <div className="admin-pills" style={{ marginTop: 24 }}>
        <Link href="/admin/orders" className={`admin-pill${!status ? " active" : ""}`}>
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`admin-pill${status === s ? " active" : ""}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Tracking</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/admin/orders/${order.id}`}>
                    {order.order_number}
                  </Link>
                </td>
                <td>
                  <div>{order.customer_name}</div>
                  <div style={{ fontSize: "0.8125rem", color: "#71717a" }}>
                    {order.customer_phone}
                  </div>
                </td>
                <td>{formatPrice(Number(order.total))}</td>
                <td>
                  <span className="admin-badge admin-badge-draft">{order.status}</span>
                </td>
                <td style={{ fontSize: "0.8125rem" }}>
                  {order.tracking_number ? (
                    <div>
                      <div style={{ fontFamily: "ui-monospace, monospace" }}>
                        {order.tracking_number}
                      </div>
                      {order.tracking_status && (
                        <div style={{ color: "#71717a", marginTop: 2 }}>
                          {order.tracking_status}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: "#a1a1aa" }}>—</span>
                  )}
                </td>
                <td style={{ color: "#71717a" }}>
                  {new Date(order.created_at).toLocaleDateString("en-PK")}
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#71717a" }}>
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
