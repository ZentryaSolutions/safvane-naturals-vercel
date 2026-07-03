import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select(`*, variants:product_variants(stock_quantity, stock_status)`)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="admin-header-row">
        <div>
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-page-sub">Manage your product catalog</p>
        </div>
        <Link href="/admin/products/new" className="admin-btn">
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Stock</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p) => {
              const totalStock = p.variants?.reduce(
                (s: number, v: { stock_quantity: number }) =>
                  s + v.stock_quantity,
                0
              );
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500, color: "#18181b" }}>{p.name}</td>
                  <td>
                    <span
                      className={`admin-badge admin-badge-${p.status}`}
                    >
                      {p.status}
                    </span>
                    {p.status !== "active" && (
                      <div className="admin-status-hint">Hidden from shop</div>
                    )}
                  </td>
                  <td>{totalStock ?? 0}</td>
                  <td>{p.featured ? "Yes" : "No"}</td>
                  <td>
                    <Link href={`/admin/products/${p.id}`}>Edit</Link>
                  </td>
                </tr>
              );
            })}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: 32, color: "#71717a" }}>
                  No products yet.{" "}
                  <Link href="/admin/products/new">Add your first product</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
