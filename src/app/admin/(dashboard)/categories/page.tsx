import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <div>
      <h1 className="admin-page-title">Categories</h1>
      <p className="admin-page-sub">Organize your product catalog</p>

      <div style={{ marginTop: 32, display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <div className="admin-card">
          <h2 className="admin-section-title">Add Category</h2>
          <CategoryForm />
        </div>

        <div className="admin-card">
          <h2 className="admin-section-title">Existing Categories</h2>
          {categories && categories.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {categories.map((cat) => (
                <div key={cat.id} style={{ paddingBottom: 24, borderBottom: "1px solid #f4f4f5" }}>
                  <CategoryForm category={cat} />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "0.875rem", color: "#71717a" }}>No categories yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
