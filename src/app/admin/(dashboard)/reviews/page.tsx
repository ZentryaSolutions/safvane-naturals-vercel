import { createClient } from "@/lib/supabase/server";
import { AdminReviewRow } from "@/components/admin/AdminReviewRow";

export default async function AdminReviewsPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("product_reviews")
    .select(`*, product:products(name, slug), images:product_review_images(id, review_id, image_url, sort_order)`)
    .order("created_at", { ascending: false });

  const pending = reviews?.filter((r) => r.status === "pending").length ?? 0;

  return (
    <div>
      <div className="admin-header-row">
        <div>
          <h1 className="admin-page-title">Customer Reviews</h1>
          <p className="admin-page-sub">
            Approve, reject, or feature top reviews on the homepage
            {pending > 0 && (
              <span className="admin-pending-badge"> · {pending} pending</span>
            )}
          </p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Customer</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Status</th>
              <th>Home</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews?.map((review) => (
              <AdminReviewRow key={review.id} review={review} />
            ))}
            {(!reviews || reviews.length === 0) && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 32, color: "#71717a" }}>
                  No reviews yet. Customer submissions will appear here for moderation.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
