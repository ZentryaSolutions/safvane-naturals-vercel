import { createClient } from "@/lib/supabase/server";
import { ExpenseForm } from "@/components/admin/ExpenseForm";
import { ExpenseRow } from "@/components/admin/ExpenseRow";

export const metadata = { title: "Expenses — Admin" };

export default async function AdminExpensesPage() {
  const supabase = await createClient();

  const [{ data: expenses }, { data: products }] = await Promise.all([
    supabase
      .from("product_expenses")
      .select(`*, product:products(name, slug)`)
      .order("expense_date", { ascending: false })
      .limit(100),
    supabase.from("products").select("id, name").order("name"),
  ]);

  const total = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      <h1 className="admin-page-title">Expenses</h1>
      <p className="admin-page-sub">
        Record costs linked to products or shop-wide operations.
      </p>

      <div className="admin-grid-2" style={{ marginTop: 28, alignItems: "start" }}>
        <section className="admin-card">
          <h2 className="admin-section-title">Add expense</h2>
          <ExpenseForm products={products ?? []} />
        </section>

        <section className="admin-card">
          <h2 className="admin-section-title">Summary</h2>
          <p className="admin-stat-value" style={{ fontSize: "2rem", marginBottom: 8 }}>
            Rs. {total.toLocaleString()}
          </p>
          <p className="admin-field-hint">
            Total recorded expenses ({expenses?.length ?? 0} entries). View full
            breakdown in Reports.
          </p>
        </section>
      </div>

      <section className="admin-card" style={{ marginTop: 28 }}>
        <h2 className="admin-section-title">Recent expenses</h2>
        {expenses && expenses.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <ExpenseRow key={expense.id} expense={expense} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-field-hint">No expenses recorded yet.</p>
        )}
      </section>
    </div>
  );
}
