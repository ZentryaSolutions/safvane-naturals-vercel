"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteExpense } from "@/app/admin/finance-actions";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import { expenseCategoryLabel } from "@/lib/finance";
import type { ProductExpense } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function ExpenseRow({ expense }: { expense: ProductExpense }) {
  const router = useRouter();
  const { showToast } = useAdminToast();

  const handleDelete = async () => {
    if (!confirm("Delete this expense record?")) return;
    const result = await deleteExpense(expense.id);
    if (result.error) showToast("error", result.error);
    else {
      showToast("success", "Expense deleted");
      router.refresh();
    }
  };

  return (
    <tr>
      <td>{new Date(expense.expense_date).toLocaleDateString("en-PK")}</td>
      <td>
        <div style={{ fontWeight: 500 }}>{expense.title}</div>
        {expense.notes && (
          <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: 2 }}>
            {expense.notes}
          </div>
        )}
      </td>
      <td>{expense.product?.name ?? "General"}</td>
      <td>{expenseCategoryLabel(expense.category)}</td>
      <td style={{ fontWeight: 600 }}>{formatPrice(Number(expense.amount))}</td>
      <td>
        <button
          type="button"
          className="admin-icon-btn admin-icon-btn-danger"
          onClick={handleDelete}
          aria-label="Delete expense"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}
