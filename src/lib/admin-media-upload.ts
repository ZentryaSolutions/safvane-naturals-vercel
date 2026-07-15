"use client";

import { createClient } from "@/lib/supabase/client";
import type { ProductImage, ProductVideo } from "@/lib/types";

export type MediaKind = "image" | "video";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

function extFromName(name: string, fallback: string) {
  const part = name.split(".").pop()?.toLowerCase();
  if (!part || part.length > 5) return fallback;
  return part.replace(/[^a-z0-9]/g, "") || fallback;
}

function validateFile(kind: MediaKind, file: File) {
  if (kind === "video") {
    if (!VIDEO_TYPES.has(file.type) && !/\.(mp4|webm|mov)$/i.test(file.name)) {
      throw new Error("Use MP4, WebM, or MOV video files.");
    }
    if (file.size > MAX_VIDEO_BYTES) {
      throw new Error("Video must be 80MB or smaller.");
    }
    return;
  }

  if (!IMAGE_TYPES.has(file.type) && !/\.(jpe?g|png|webp|gif|avif)$/i.test(file.name)) {
    throw new Error("Use JPG, PNG, WebP, GIF, or AVIF images.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 12MB or smaller.");
  }
}

/**
 * Upload directly to Supabase Storage from the browser.
 * Required on Vercel: serverless requests are capped ~4.5MB (413 otherwise).
 */
export async function uploadProductMediaDirect(options: {
  productId: string;
  kind: MediaKind;
  file: File;
  onProgress?: (label: string) => void;
}): Promise<{ image?: ProductImage; video?: ProductVideo }> {
  const { productId, kind, file, onProgress } = options;
  validateFile(kind, file);

  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized. Please sign in again.");
  }

  const bucket = kind === "video" ? "product-videos" : "product-images";
  const ext = extFromName(file.name, kind === "video" ? "mp4" : "jpg");
  const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  onProgress?.(
    kind === "video"
      ? `Uploading video to storage… (${Math.round(file.size / (1024 * 1024))}MB)`
      : "Uploading image to storage…"
  );

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || (kind === "video" ? "video/mp4" : "image/jpeg"),
    upsert: false,
    cacheControl: "3600",
  });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  onProgress?.("Saving to product…");

  const res = await fetch("/api/admin/product-media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, kind, path }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Best-effort cleanup if DB register fails
    await supabase.storage.from(bucket).remove([path]).catch(() => null);
    throw new Error(data.error || `Upload failed (${res.status})`);
  }

  return data as { image?: ProductImage; video?: ProductVideo };
}
