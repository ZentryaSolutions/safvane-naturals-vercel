"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProductBatch } from "@/lib/types";

export async function saveProductBatch(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string | null;
  const productId = formData.get("product_id") as string;
  const productSlug = formData.get("product_slug") as string;
  const variantId = (formData.get("variant_id") as string) || null;

  const data = {
    product_id: productId,
    variant_id: variantId || null,
    batch_number: (formData.get("batch_number") as string).trim().toUpperCase(),
    manufactured_at: formData.get("manufactured_at") as string,
    expires_at: formData.get("expires_at") as string,
    quantity: parseInt((formData.get("quantity") as string) || "0", 10),
    notes: (formData.get("notes") as string)?.trim() || null,
    status: (formData.get("status") as ProductBatch["status"]) || "active",
  };

  if (!data.batch_number || !data.manufactured_at || !data.expires_at) {
    return { error: "Batch number, manufacture date, and expiry date are required." };
  }

  if (id) {
    const { error } = await supabase.from("product_batches").update(data).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("product_batches").insert(data);
    if (error) return { error: error.message };
  }

  revalidatePath(`/admin/products/${productId}`);
  if (productSlug) revalidatePath(`/products/${productSlug}`);
  return { success: true };
}

export async function deleteProductBatch(
  batchId: string,
  productId: string,
  productSlug?: string
) {
  const supabase = await createClient();
  const { error } = await supabase.from("product_batches").delete().eq("id", batchId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/products/${productId}`);
  if (productSlug) revalidatePath(`/products/${productSlug}`);
  return { success: true };
}

export async function generateVariantSkus(productId: string, productSlug: string) {
  const supabase = await createClient();
  const { data: variants, error } = await supabase
    .from("product_variants")
    .select("id, variant_label, sku")
    .eq("product_id", productId);

  if (error || !variants) return { error: error?.message ?? "Could not load variants" };

  const { generateVariantSku } = await import("@/lib/sku");

  for (const variant of variants) {
    if (variant.sku?.trim()) continue;
    const sku = generateVariantSku(productSlug, variant.variant_label);
    await supabase.from("product_variants").update({ sku }).eq("id", variant.id);
  }

  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}
