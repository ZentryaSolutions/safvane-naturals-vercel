"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveExpense } from "@/app/admin/finance-actions";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import { EXPENSE_CATEGORIES } from "@/lib/finance";
import type { ProductExpense } from "@/lib/types";

interface ExpenseFormProps {
  products: { id: string; name: string }[];
  expense?: ProductExpense;
  onCancel?: () => void;
}

export function ExpenseForm({ products, expense, onCancel }: ExpenseFormProps) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const result = await saveExpense(form);
    setSaving(false);

    if (result.error) {
      showToast("error", result.error);
      return;
    }

    showToast("success", expense ? "Expense updated" : "Expense recorded");
    router.refresh();
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      {expense && <input type="hidden" name="id" value={expense.id} />}

      <div className="field">
        <label htmlFor="expense-title">Title *</label>
        <input
          id="expense-title"
          name="title"
          required
          defaultValue={expense?.title ?? ""}
          placeholder="e.g. Amber bottles — 50ml batch"
        />
      </div>

      <div className="form-pair">
        <div className="field">
          <label htmlFor="expense-amount">Amount (PKR) *</label>
          <input
            id="expense-amount"
            name="amount"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={expense?.amount ?? ""}
          />
        </div>
        <div className="field">
          <label htmlFor="expense-date">Date *</label>
          <input
            id="expense-date"
            name="expense_date"
            type="date"
            required
            defaultValue={
              expense?.expense_date ?? new Date().toISOString().slice(0, 10)
            }
          />
        </div>
      </div>

      <div className="form-pair">
        <div className="field">
          <label htmlFor="expense-category">Category *</label>
          <select
            id="expense-category"
            name="category"
            required
            defaultValue={expense?.category ?? "other"}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="expense-product">Product (optional)</label>
          <select
            id="expense-product"
            name="product_id"
            defaultValue={expense?.product_id ?? ""}
          >
            <option value="">Shop-wide / general</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="expense-notes">Notes</label>
        <textarea
          id="expense-notes"
          name="notes"
          rows={3}
          defaultValue={expense?.notes ?? ""}
          placeholder="Invoice ref, supplier, etc."
        />
      </div>

      <div className="admin-form-actions">
        <button type="submit" className="admin-btn" disabled={saving}>
          {saving ? "Saving..." : expense ? "Update expense" : "Add expense"}
        </button>
        {onCancel && (
          <button type="button" className="admin-btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
