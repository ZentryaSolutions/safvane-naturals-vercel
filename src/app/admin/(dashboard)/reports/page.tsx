import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { expenseCategoryLabel } from "@/lib/finance";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Reports — Admin" };

function sumOrders(orders: { total: number; status: string }[] | null) {
  return (orders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);
}

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { data: allOrders },
    { data: monthOrders },
    { data: expenses },
    { data: monthExpenses },
    { data: lowStock },
    { data: expensesByCategory },
  ] = await Promise.all([
    supabase.from("orders").select("total, status"),
    supabase
      .from("orders")
      .select("total, status")
      .gte("created_at", monthStart),
    supabase.from("product_expenses").select("amount"),
    supabase
      .from("product_expenses")
      .select("amount")
      .gte("expense_date", monthStart.slice(0, 10)),
    supabase
      .from("product_variants")
      .select(`*, product:products(name, slug)`)
      .lte("stock_quantity", 10)
      .order("stock_quantity", { ascending: true })
      .limit(10),
    supabase.from("product_expenses").select("category, amount"),
  ]);

  const totalRevenue = sumOrders(allOrders);
  const monthRevenue = sumOrders(monthOrders);
  const totalExpenses = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const monthExpenseTotal = (monthExpenses ?? []).reduce(
    (s, e) => s + Number(e.amount),
    0
  );

  const categoryTotals: Record<string, number> = {};
  for (const row of expensesByCategory ?? []) {
    categoryTotals[row.category] =
      (categoryTotals[row.category] ?? 0) + Number(row.amount);
  }

  return (
    <div>
      <h1 className="admin-page-title">Reports</h1>
      <p className="admin-page-sub">
        Revenue, expenses, and inventory — make decisions with real numbers.
      </p>

      <div className="admin-grid-4" style={{ marginTop: 28 }}>
        <div className="admin-card admin-stat">
          <p className="admin-stat-label">Total revenue</p>
          <p className="admin-stat-value">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="admin-card admin-stat">
          <p className="admin-stat-label">This month revenue</p>
          <p className="admin-stat-value">{formatPrice(monthRevenue)}</p>
        </div>
        <div className="admin-card admin-stat">
          <p className="admin-stat-label">Total expenses</p>
          <p className="admin-stat-value">{formatPrice(totalExpenses)}</p>
        </div>
        <div className="admin-card admin-stat">
          <p className="admin-stat-label">Net (revenue − expenses)</p>
          <p
            className="admin-stat-value"
            style={{ color: totalRevenue - totalExpenses >= 0 ? "#166534" : "#b91c1c" }}
          >
            {formatPrice(totalRevenue - totalExpenses)}
          </p>
        </div>
      </div>

      <div className="admin-grid-2" style={{ marginTop: 28, alignItems: "start" }}>
        <section className="admin-card">
          <h2 className="admin-section-title">Low stock</h2>
          {lowStock && lowStock.length > 0 ? (
            <ul className="admin-divider-list">
              {lowStock.map((v) => (
                <li key={v.id}>
                  <span>
                    {v.product?.name} ({v.variant_label})
                  </span>
                  <span style={{ fontWeight: 600, color: "#d97706" }}>
                    {v.stock_quantity} left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-field-hint">All variants above low-stock threshold.</p>
          )}
          <p className="admin-field-hint" style={{ marginTop: 16 }}>
            Update stock under Products when you receive new inventory.
          </p>
        </section>

        <section className="admin-card">
          <h2 className="admin-section-title">Expenses by category</h2>
          {Object.keys(categoryTotals).length > 0 ? (
            <ul className="admin-divider-list">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amt]) => (
                  <li key={cat}>
                    <span>{expenseCategoryLabel(cat)}</span>
                    <span style={{ fontWeight: 600 }}>{formatPrice(amt)}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="admin-field-hint">
              No expenses yet.{" "}
              <Link href="/admin/expenses">Add expenses →</Link>
            </p>
          )}
          <p className="admin-field-hint" style={{ marginTop: 12 }}>
            This month: {formatPrice(monthExpenseTotal)}
          </p>
        </section>
      </div>
    </div>
  );
}
