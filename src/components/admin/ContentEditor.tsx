"use client";

import { useState } from "react";
import { saveContentPage } from "@/app/admin/actions";
import { useAdminToast } from "@/components/admin/AdminToastProvider";
import type { ContentPage } from "@/lib/types";

interface ContentEditorProps {
  page: ContentPage;
  label: string;
}

export function ContentEditor({ page, label }: ContentEditorProps) {
  const { showToast } = useAdminToast();
  const [content, setContent] = useState(page.content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await saveContentPage(page.page_key, content);
    setSaving(false);
    if (result.error) showToast("error", result.error);
    else showToast("success", `${label} saved successfully`);
  };

  return (
    <div className="admin-card">
      <h2 className="admin-section-title">{label}</h2>
      <p style={{ fontSize: "0.8125rem", color: "#71717a", marginBottom: 16 }}>
        Supports Markdown formatting
      </p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={12}
        style={{ width: "100%", fontFamily: "monospace", fontSize: "0.8125rem" }}
      />
      <button type="button" onClick={handleSave} disabled={saving} className="admin-btn" style={{ marginTop: 16 }}>
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
