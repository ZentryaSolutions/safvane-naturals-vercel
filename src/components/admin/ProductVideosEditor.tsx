"use client";

import { useEffect, useState } from "react";
import { Film, Trash2, Upload } from "lucide-react";
import type { ProductVideo } from "@/lib/types";
import { useAdminToast } from "@/components/admin/AdminToastProvider";

interface ProductVideosEditorProps {
  productId: string;
  initialVideos: ProductVideo[];
}

async function uploadVideo(productId: string, file: File) {
  const fd = new FormData();
  fd.set("productId", productId);
  fd.set("kind", "video");
  fd.set("file", file);

  const res = await fetch("/api/admin/product-media", {
    method: "POST",
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  return data as { success: true; video: ProductVideo };
}

export function ProductVideosEditor({
  productId,
  initialVideos,
}: ProductVideosEditorProps) {
  const { showToast } = useAdminToast();
  const [videos, setVideos] = useState<ProductVideo[]>(
    [...initialVideos].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setVideos([...initialVideos].sort((a, b) => a.sort_order - b.sort_order));
  }, [initialVideos]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const list = Array.from(files);
    const added: ProductVideo[] = [];

    try {
      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        setProgress(`Uploading video ${i + 1} of ${list.length}…`);
        try {
          const result = await uploadVideo(productId, file);
          if (result.video) added.push(result.video);
        } catch (err) {
          showToast(
            "error",
            err instanceof Error ? err.message : `Failed: ${file.name}`
          );
        }
      }

      if (added.length) {
        setVideos((prev) =>
          [...prev, ...added].sort((a, b) => a.sort_order - b.sort_order)
        );
        showToast(
          "success",
          added.length === 1 ? "Video uploaded" : `${added.length} videos uploaded`
        );
      }
    } finally {
      setUploading(false);
      setProgress("");
      e.target.value = "";
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm("Remove this video?")) return;
    setBusyId(videoId);
    try {
      const res = await fetch("/api/admin/product-media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "video", id: videoId, productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data.error || "Delete failed");
        return;
      }
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      showToast("success", "Video removed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-card admin-product-card" style={{ marginTop: 20 }}>
      <div className="admin-image-guide">
        <strong>Product videos:</strong> MP4 or WebM recommended · Max 80MB ·
        Shown in the product gallery so customers can play them on the product
        page.
      </div>

      {videos.length > 0 && (
        <div className="admin-video-grid">
          {videos.map((video) => (
            <div
              key={video.id}
              className={`admin-video-thumb${busyId === video.id ? " is-busy" : ""}`}
            >
              <video
                src={video.video_url}
                controls
                preload="metadata"
                playsInline
                className="admin-video-player"
              />
              <button
                type="button"
                className="admin-image-tool-btn admin-image-tool-delete"
                onClick={() => handleDelete(video.id)}
                disabled={busyId !== null}
                title="Delete video"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {videos.length === 0 && (
        <p className="admin-empty-hint">
          <Film size={16} aria-hidden /> No videos yet. Upload one to show on the
          product page.
        </p>
      )}

      <label className={`admin-upload-label${uploading ? " is-uploading" : ""}`}>
        <Upload size={16} />
        {uploading ? progress || "Uploading video..." : "Upload video"}
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          onChange={handleUpload}
          disabled={uploading}
          hidden
        />
      </label>
    </div>
  );
}
