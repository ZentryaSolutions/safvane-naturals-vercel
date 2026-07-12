import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 120;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

function extFromName(name: string, fallback: string) {
  const part = name.split(".").pop()?.toLowerCase();
  if (!part || part.length > 5) return fallback;
  return part.replace(/[^a-z0-9]/g, "") || fallback;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

async function revalidateProduct(productId: string) {
  const service = createServiceClient();
  const { data } = await service
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  if (data?.slug) revalidatePath(`/products/${data.slug}`);
  revalidatePath(`/admin/products/${productId}`);
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in again." },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const productId = String(formData.get("productId") ?? "").trim();
    const kind = String(formData.get("kind") ?? "image").trim();
    const file = formData.get("file");

    if (!productId) {
      return NextResponse.json({ error: "Missing product id." }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    const service = createServiceClient();
    const { data: product, error: productError } = await service
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    if (kind === "video") {
      if (!VIDEO_TYPES.has(file.type) && !/\.(mp4|webm|mov)$/i.test(file.name)) {
        return NextResponse.json(
          { error: "Use MP4, WebM, or MOV video files." },
          { status: 400 }
        );
      }
      if (file.size > MAX_VIDEO_BYTES) {
        return NextResponse.json(
          { error: "Video must be 80MB or smaller." },
          { status: 400 }
        );
      }

      const ext = extFromName(file.name, "mp4");
      const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const bytes = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await service.storage
        .from("product-videos")
        .upload(path, bytes, {
          contentType: file.type || "video/mp4",
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      const {
        data: { publicUrl },
      } = service.storage.from("product-videos").getPublicUrl(path);

      const { data: existing } = await service
        .from("product_videos")
        .select("sort_order")
        .eq("product_id", productId)
        .order("sort_order", { ascending: false })
        .limit(1);

      const sortOrder = (existing?.[0]?.sort_order ?? -1) + 1;
      const { data: video, error: insertError } = await service
        .from("product_videos")
        .insert({
          product_id: productId,
          video_url: publicUrl,
          sort_order: sortOrder,
        })
        .select("*")
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      await revalidateProduct(productId);
      return NextResponse.json({ success: true, video });
    }

    if (!IMAGE_TYPES.has(file.type) && !/\.(jpe?g|png|webp|gif|avif)$/i.test(file.name)) {
      return NextResponse.json(
        { error: "Use JPG, PNG, WebP, GIF, or AVIF images." },
        { status: 400 }
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image must be 12MB or smaller." },
        { status: 400 }
      );
    }

    const ext = extFromName(file.name, "jpg");
    const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await service.storage
      .from("product-images")
      .upload(path, bytes, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = service.storage.from("product-images").getPublicUrl(path);

    const { data: existing } = await service
      .from("product_images")
      .select("sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: false })
      .limit(1);

    const sortOrder = (existing?.[0]?.sort_order ?? -1) + 1;
    const { data: image, error: insertError } = await service
      .from("product_images")
      .insert({
        product_id: productId,
        image_url: publicUrl,
        sort_order: sortOrder,
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await revalidateProduct(productId);
    return NextResponse.json({ success: true, image });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("product-media upload:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const kind = String(body.kind ?? "image");
    const id = String(body.id ?? "");
    const productId = String(body.productId ?? "");

    if (!id || !productId) {
      return NextResponse.json({ error: "Missing id." }, { status: 400 });
    }

    const service = createServiceClient();

    if (kind === "video") {
      const { data: video } = await service
        .from("product_videos")
        .select("video_url")
        .eq("id", id)
        .eq("product_id", productId)
        .maybeSingle();

      const { error } = await service
        .from("product_videos")
        .delete()
        .eq("id", id)
        .eq("product_id", productId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (video?.video_url?.includes("/product-videos/")) {
        const path = video.video_url.split("/product-videos/")[1];
        if (path) {
          await service.storage.from("product-videos").remove([path]);
        }
      }

      await revalidateProduct(productId);
      return NextResponse.json({ success: true });
    }

    const { data: image } = await service
      .from("product_images")
      .select("image_url")
      .eq("id", id)
      .eq("product_id", productId)
      .maybeSingle();

    const { error } = await service
      .from("product_images")
      .delete()
      .eq("id", id)
      .eq("product_id", productId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (image?.image_url?.includes("/product-images/")) {
      const path = image.image_url.split("/product-images/")[1];
      if (path) {
        await service.storage.from("product-images").remove([path]);
      }
    }

    await revalidateProduct(productId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
