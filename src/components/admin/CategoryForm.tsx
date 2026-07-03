"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveCategory, deleteCategory } from "@/app/admin/actions";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import { slugify } from "@/lib/utils";
import type { Category } from "@/lib/types";
import { Trash2 } from "lucide-react";

interface CategoryFormProps {
  category?: Category;
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const result = await saveCategory(form);
    setSaving(false);
    if (result.error) {
      showToast("error", result.error);
      return;
    }
    showToast("success", category ? "Category updated" : "Category added");
    if (!category) {
      setName("");
      setSlug("");
    }
    router.refresh();
  };

  const handleDelete = async () => {
    if (!category || !confirm("Delete this category?")) return;
    const result = await deleteCategory(category.id);
    if (result.error) showToast("error", result.error);
    else showToast("success", "Category deleted");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      {category && <input type="hidden" name="id" value={category.id} />}
      <div className="field-row">
        <div className="field">
          <input
            name="name"
            required
            placeholder="Category name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!category) setSlug(slugify(e.target.value));
            }}
          />
        </div>
        <div className="field">
          <input
            name="slug"
            required
            placeholder="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </div>
      </div>
      <div className="field">
        <textarea
          name="description"
          placeholder="Description (optional)"
          defaultValue={category?.description ?? ""}
          rows={2}
        />
      </div>
      <div className="field">
        <input
          type="number"
          name="sort_order"
          placeholder="Sort order"
          defaultValue={category?.sort_order ?? 0}
          style={{ width: 120 }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="submit" className="admin-btn" disabled={saving}>
          {saving ? "Saving..." : category ? "Update" : "Add Category"}
        </button>
        {category && (
          <button type="button" onClick={handleDelete} className="admin-btn-danger">
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </form>
  );
}
