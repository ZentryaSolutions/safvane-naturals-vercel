"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteProductBatch, saveProductBatch } from "@/app/admin/batch-actions";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import { formatPackDate } from "@/lib/sku";
import type { ProductBatch, ProductVariant } from "@/lib/types";

interface ProductBatchesProps {
  productId: string;
  productSlug: string;
  variants: ProductVariant[];
  batches: ProductBatch[];
  embedded?: boolean;
}

const emptyForm = {
  id: "",
  batch_number: "",
  manufactured_at: "",
  expires_at: "",
  quantity: "0",
  variant_id: "",
  status: "active" as ProductBatch["status"],
  notes: "",
};

export function ProductBatches({
  productId,
  productSlug,
  variants,
  batches,
  embedded,
}: ProductBatchesProps) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const openNew = () => {
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (batch: ProductBatch) => {
    setForm({
      id: batch.id,
      batch_number: batch.batch_number,
      manufactured_at: batch.manufactured_at,
      expires_at: batch.expires_at,
      quantity: String(batch.quantity),
      variant_id: batch.variant_id ?? "",
      status: batch.status,
      notes: batch.notes ?? "",
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const fd = new FormData();
    if (form.id) fd.set("id", form.id);
    fd.set("product_id", productId);
    fd.set("product_slug", productSlug);
    fd.set("batch_number", form.batch_number);
    fd.set("manufactured_at", form.manufactured_at);
    fd.set("expires_at", form.expires_at);
    fd.set("quantity", form.quantity);
    fd.set("variant_id", form.variant_id);
    fd.set("status", form.status);
    fd.set("notes", form.notes);

    const result = await saveProductBatch(fd);
    if (result.error) {
      setError(result.error);
      showToast("error", result.error);
      setSaving(false);
      return;
    }

    showToast("success", form.id ? "Batch updated" : "Batch created");

    setShowForm(false);
    setForm(emptyForm);
    router.refresh();
    setSaving(false);
  };

  const handleDelete = async (batchId: string) => {
    if (!confirm("Delete this batch record?")) return;
    const result = await deleteProductBatch(batchId, productId, productSlug);
    if (result.error) {
      setError(result.error);
      showToast("error", result.error);
    } else {
      showToast("success", "Batch deleted");
      router.refresh();
    }
  };

  const variantLabel = (variantId: string | null) => {
    if (!variantId) return "All variants";
    return variants.find((v) => v.id === variantId)?.variant_label ?? "—";
  };

  return (
    <div className={`admin-card admin-packaging-card${embedded ? " admin-packaging-card-embedded" : ""}`}>
      {!embedded && (
        <div className="admin-packaging-card-head">
          <div>
            <h2 className="admin-section-title">Production batches</h2>
            <p className="admin-field-hint">
              Track batch numbers and MFG/EXP dates for each production run.
            </p>
          </div>
          {!showForm && (
            <button type="button" className="admin-btn admin-btn-sm" onClick={openNew}>
              <Plus size={14} />
              Add batch
            </button>
          )}
        </div>
      )}

      {embedded && !showForm && (
        <div className="admin-packaging-card-head">
          <p className="admin-field-hint" style={{ margin: 0 }}>
            Add a batch for each production run. Use the batch on your box label and for
            traceability.
          </p>
          <button type="button" className="admin-btn admin-btn-sm" onClick={openNew}>
            <Plus size={14} />
            Add batch
          </button>
        </div>
      )}

      {error && <div className="admin-alert-error">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-batch-form admin-form">
          <div className="admin-batch-form-head">
            <h3>{form.id ? "Edit batch" : "New batch"}</h3>
            <button type="button" className="admin-icon-btn" onClick={() => setShowForm(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="admin-batch-form-grid admin-batch-form-grid-2">
            <div className="field">
              <label>Batch number *</label>
              <input
                required
                value={form.batch_number}
                onChange={(e) => setForm({ ...form, batch_number: e.target.value.toUpperCase() })}
                placeholder="e.g. BSN-2026-001"
              />
            </div>
            <div className="field">
              <label>Variant</label>
              <select
                value={form.variant_id}
                onChange={(e) => setForm({ ...form, variant_id: e.target.value })}
              >
                <option value="">All variants / shared batch</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.variant_label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-batch-form-grid admin-batch-form-grid-3">
            <div className="field">
              <label>Manufactured (MFG) *</label>
              <input
                type="date"
                required
                value={form.manufactured_at}
                onChange={(e) => setForm({ ...form, manufactured_at: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Expires (EXP) *</label>
              <input
                type="date"
                required
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Units in batch</label>
              <input
                type="number"
                min={0}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
          </div>

          <div className="admin-batch-form-grid admin-batch-form-grid-status">
            <div className="field">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as ProductBatch["status"] })
                }
              >
                <option value="active">Active</option>
                <option value="depleted">Depleted</option>
                <option value="recalled">Recalled</option>
              </select>
            </div>
            <div className="field">
              <label>Notes (optional)</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Supplier lot, press run, etc."
              />
            </div>
          </div>

          <div className="admin-batch-form-actions">
            <button type="submit" className="admin-btn" disabled={saving}>
              {saving ? "Saving…" : form.id ? "Update batch" : "Save batch"}
            </button>
            <button type="button" className="admin-btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {!showForm && batches.length === 0 && (
        <div className="admin-packaging-empty">
          <p>No batches yet.</p>
          <button type="button" className="admin-btn admin-btn-sm" onClick={openNew}>
            <Plus size={14} />
            Add your first batch
          </button>
        </div>
      )}

      {!showForm && batches.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Batch No.</th>
                <th>Variant</th>
                <th>MFG</th>
                <th>EXP</th>
                <th>Qty</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id}>
                  <td>
                    <strong>{batch.batch_number}</strong>
                  </td>
                  <td>{variantLabel(batch.variant_id)}</td>
                  <td>{formatPackDate(batch.manufactured_at)}</td>
                  <td>{formatPackDate(batch.expires_at)}</td>
                  <td>{batch.quantity}</td>
                  <td>
                    <span className={`admin-batch-status admin-batch-status-${batch.status}`}>
                      {batch.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-review-actions">
                      <button
                        type="button"
                        className="admin-icon-btn"
                        onClick={() => openEdit(batch)}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn admin-icon-btn-danger"
                        onClick={() => handleDelete(batch.id)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
