import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

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

/**
 * Register a file already uploaded directly to Supabase Storage.
 * Large files must NOT pass through this route (Vercel 413 body limit ~4.5MB).
 *
 * Body: { productId, kind: "image"|"video", path: "<productId>/filename.ext" }
 */
export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in again." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request. Upload files directly to storage first." },
        { status: 400 }
      );
    }

    const productId = String(body.productId ?? "").trim();
    const kind = String(body.kind ?? "image").trim();
    const path = String(body.path ?? "").trim().replace(/^\/+/, "");

    if (!productId) {
      return NextResponse.json({ error: "Missing product id." }, { status: 400 });
    }
    if (!path || path.includes("..") || !path.startsWith(`${productId}/`)) {
      return NextResponse.json({ error: "Invalid storage path." }, { status: 400 });
    }
    if (kind !== "image" && kind !== "video") {
      return NextResponse.json({ error: "Invalid media kind." }, { status: 400 });
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

    const bucket = kind === "video" ? "product-videos" : "product-images";

    // Confirm object exists in storage
    const folder = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    const fileName = path.includes("/") ? path.slice(path.lastIndexOf("/") + 1) : path;
    const { data: listed, error: listError } = await service.storage
      .from(bucket)
      .list(folder, { search: fileName, limit: 20 });

    if (listError) {
      return NextResponse.json(
        { error: `Could not verify upload: ${listError.message}` },
        { status: 500 }
      );
    }

    const found = listed?.some((f) => f.name === fileName);
    if (!found) {
      return NextResponse.json(
        { error: "Uploaded file not found in storage. Try again." },
        { status: 400 }
      );
    }

    const {
      data: { publicUrl },
    } = service.storage.from(bucket).getPublicUrl(path);

    if (kind === "video") {
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
    console.error("product-media register:", message);
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
