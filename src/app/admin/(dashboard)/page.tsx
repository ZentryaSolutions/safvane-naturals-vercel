import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { Package, ShoppingCart, AlertCircle, Wallet, BarChart3 } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: productCount },
    { count: orderCount },
    { data: recentOrders },
    { data: lowStock },
    { data: orders },
    { data: expenses },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("product_variants")
      .select(`*, product:products(name)`)
      .lte("stock_quantity", 5)
      .order("stock_quantity", { ascending: true })
      .limit(5),
    supabase.from("orders").select("total, status"),
    supabase.from("product_expenses").select("amount"),
  ]);

  const revenue = (orders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total), 0);
  const expenseTotal = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <h1 className="admin-page-title">Dashboard</h1>
      <p className="admin-page-sub">Overview of your store</p>

      <div className="admin-grid-3" style={{ marginTop: 32 }}>
        <div className="admin-card admin-stat">
          <Package className="admin-stat-icon" size={32} />
          <div>
            <p className="admin-stat-label">Products</p>
            <p className="admin-stat-value">{productCount ?? 0}</p>
          </div>
        </div>
        <div className="admin-card admin-stat">
          <ShoppingCart className="admin-stat-icon" size={32} />
          <div>
            <p className="admin-stat-label">Total Orders</p>
            <p className="admin-stat-value">{orderCount ?? 0}</p>
          </div>
        </div>
        <div className="admin-card admin-stat">
          <BarChart3 className="admin-stat-icon" size={32} />
          <div>
            <p className="admin-stat-label">Revenue</p>
            <p className="admin-stat-value">{formatPrice(revenue)}</p>
          </div>
        </div>
        <div className="admin-card admin-stat">
          <Wallet className="admin-stat-icon" size={32} />
          <div>
            <p className="admin-stat-label">Expenses</p>
            <p className="admin-stat-value">{formatPrice(expenseTotal)}</p>
          </div>
        </div>
        <div className="admin-card admin-stat">
          <AlertCircle className="admin-stat-icon" size={32} style={{ color: "#d97706" }} />
          <div>
            <p className="admin-stat-label">Low Stock Items</p>
            <p className="admin-stat-value">{lowStock?.length ?? 0}</p>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Link href="/admin/reports" className="admin-btn admin-btn-sm">
          View reports
        </Link>
        <Link href="/admin/expenses" className="admin-btn-ghost admin-btn-sm">
          Record expense
        </Link>
      </div>

      <div
        style={{
          marginTop: 40,
          display: "grid",
          gap: 32,
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        }}
      >
        <section className="admin-card">
          <h2 className="admin-section-title">Recent Orders</h2>
          {recentOrders && recentOrders.length > 0 ? (
            <ul className="admin-divider-list">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <div>
                    <Link href={`/admin/orders/${order.id}`}>
                      {order.order_number}
                    </Link>
                    <p style={{ fontSize: "0.8125rem", color: "#71717a", marginTop: 2 }}>
                      {order.customer_name}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontWeight: 500 }}>{formatPrice(Number(order.total))}</p>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#71717a",
                        textTransform: "capitalize",
                      }}
                    >
                      {order.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: "0.875rem", color: "#71717a" }}>No orders yet.</p>
          )}
        </section>

        <section className="admin-card">
          <h2 className="admin-section-title">Low stock</h2>
          {lowStock && lowStock.length > 0 ? (
            <ul className="admin-divider-list">
              {lowStock.map((v) => (
                <li key={v.id}>
                  <span>
                    {v.product?.name} ({v.variant_label})
                  </span>
                  <span style={{ fontWeight: 500, color: "#d97706" }}>
                    {v.stock_quantity} left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: "0.875rem", color: "#71717a" }}>All stock levels OK.</p>
          )}
        </section>
      </div>
    </div>
  );
}
