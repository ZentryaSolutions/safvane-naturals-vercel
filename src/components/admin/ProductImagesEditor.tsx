"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { reorderProductImages } from "@/app/admin/actions";
import { PRODUCT_IMAGE_GUIDE } from "@/lib/constants";
import type { ProductImage } from "@/lib/types";
import { useAdminToast } from "@/components/admin/AdminToastProvider";

interface ProductImagesEditorProps {
  productId: string;
  initialImages: ProductImage[];
}

async function uploadViaApi(productId: string, file: File) {
  const fd = new FormData();
  fd.set("productId", productId);
  fd.set("kind", "image");
  fd.set("file", file);

  const res = await fetch("/api/admin/product-media", {
    method: "POST",
    body: fd,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  return data as { success: true; image: ProductImage };
}

export function ProductImagesEditor({
  productId,
  initialImages,
}: ProductImagesEditorProps) {
  const { showToast } = useAdminToast();
  const [images, setImages] = useState<ProductImage[]>(
    [...initialImages].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setImages([...initialImages].sort((a, b) => a.sort_order - b.sort_order));
  }, [initialImages]);

  const persistOrder = async (ordered: ProductImage[]) => {
    const result = await reorderProductImages(
      productId,
      ordered.map((img) => img.id)
    );
    if (result.error) {
      showToast("error", result.error);
      setImages([...initialImages].sort((a, b) => a.sort_order - b.sort_order));
      return false;
    }
    return true;
  };

  const moveImage = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;

    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next.map((img, i) => ({ ...img, sort_order: i })));
    setBusyId(next[target].id);

    const ok = await persistOrder(next);
    if (ok) showToast("success", "Image order updated");
    setBusyId(null);
  };

  const setPrimary = async (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    setImages(next.map((img, i) => ({ ...img, sort_order: i })));
    setBusyId(picked.id);

    const ok = await persistOrder(next);
    if (ok) showToast("success", "Primary image updated");
    setBusyId(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const list = Array.from(files);
    const added: ProductImage[] = [];

    try {
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        setProgress(`Uploading ${i + 1} of ${list.length}…`);
        try {
          const result = await uploadViaApi(productId, file);
          if (result.image) added.push(result.image);
        } catch (err) {
          showToast(
            "error",
            err instanceof Error ? err.message : `Failed: ${file.name}`
          );
        }
      }

      if (added.length) {
        setImages((prev) =>
          [...prev, ...added].sort((a, b) => a.sort_order - b.sort_order)
        );
        showToast(
          "success",
          added.length === 1 ? "Image uploaded" : `${added.length} images uploaded`
        );
      }
    } finally {
      setUploading(false);
      setProgress("");
      e.target.value = "";
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("Remove this image?")) return;
    setBusyId(imageId);
    try {
      const res = await fetch("/api/admin/product-media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "image", id: imageId, productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data.error || "Delete failed");
        return;
      }
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      showToast("success", "Image removed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-card admin-product-card">
      <div className="admin-image-guide">
        <strong>Recommended:</strong> {PRODUCT_IMAGE_GUIDE.width}×
        {PRODUCT_IMAGE_GUIDE.height}px ({PRODUCT_IMAGE_GUIDE.ratio}) ·{" "}
        {PRODUCT_IMAGE_GUIDE.formats}
        <br />
        {PRODUCT_IMAGE_GUIDE.tip}
        <br />
        <span style={{ color: "#7a6010" }}>
          First image = primary photo on shop & product page. Max 12MB per image.
        </span>
      </div>

      <div className="admin-image-grid admin-product-image-grid">
        {images.map((img, index) => (
          <div
            key={img.id}
            className={`admin-image-thumb admin-product-image-thumb${busyId === img.id ? " is-busy" : ""}`}
          >
            {index === 0 && <span className="admin-image-primary-badge">Primary</span>}
            <Image
              src={img.image_url}
              alt=""
              fill
              sizes="160px"
              style={{ objectFit: "contain", padding: 8, background: "#f8f8f8" }}
            />
            <div className="admin-image-toolbar">
              <button
                type="button"
                className="admin-image-tool-btn"
                onClick={() => moveImage(index, -1)}
                disabled={index === 0 || busyId !== null}
                title="Move left"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                type="button"
                className="admin-image-tool-btn"
                onClick={() => moveImage(index, 1)}
                disabled={index === images.length - 1 || busyId !== null}
                title="Move right"
              >
                <ArrowRight size={14} />
              </button>
              {index !== 0 && (
                <button
                  type="button"
                  className="admin-image-tool-btn admin-image-tool-primary"
                  onClick={() => setPrimary(index)}
                  disabled={busyId !== null}
                  title="Make primary image"
                >
                  <Star size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                className="admin-image-tool-btn admin-image-tool-delete"
                disabled={busyId !== null}
                title="Delete image"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <label className={`admin-upload-label${uploading ? " is-uploading" : ""}`}>
        <Upload size={16} />
        {uploading ? progress || "Uploading..." : "Upload image(s)"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          hidden
        />
      </label>
    </div>
  );
}
