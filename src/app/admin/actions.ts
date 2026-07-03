"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/utils";
import { parseBenefitsField } from "@/lib/rich-content";

export async function saveProduct(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || slugify(name);
  const categoryId = formData.get("category_id") as string;

  const productData = {
    name,
    slug,
    description: formData.get("description") as string,
    short_description: (formData.get("short_description") as string) || null,
    ingredients: (formData.get("ingredients") as string) || null,
    how_to_use: (formData.get("how_to_use") as string) || null,
    delivery_returns: (formData.get("delivery_returns") as string) || null,
    benefits: parseBenefitsField((formData.get("benefits") as string) || ""),
    category_id: categoryId,
    status: formData.get("status") as "active" | "draft" | "hidden",
    featured: formData.get("featured") === "on",
    meta_title: (formData.get("meta_title") as string) || null,
    meta_description: (formData.get("meta_description") as string) || null,
    use_shop_shipping: formData.get("use_shop_shipping") !== "off",
    product_free_shipping: formData.get("product_free_shipping") === "on",
    use_shop_promo: formData.get("use_shop_promo") !== "off",
    promo_enabled: formData.get("promo_enabled") === "on",
    promo_headline: (formData.get("promo_headline") as string)?.trim() || null,
    promo_message: (formData.get("promo_message") as string)?.trim() || null,
    promo_ends_at: (formData.get("promo_ends_at") as string) || null,
  };

  let productId = id;

  if (id) {
    const { error } = await supabase
      .from("products")
      .update(productData)
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(productData)
      .select("id")
      .single();
    if (error) return { error: error.message };
    productId = data.id;
  }

  const variantsJson = formData.get("variants") as string;
  if (variantsJson && productId) {
    const variants = JSON.parse(variantsJson) as Array<{
      id?: string;
      variant_label: string;
      price: number;
      compare_at_price?: number | null;
      stock_quantity: number;
      sku?: string;
    }>;

    const existingIds = variants.filter((v) => v.id).map((v) => v.id!);
    if (id) {
      const { data: current } = await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", productId);
      const toDelete = (current ?? [])
        .map((c) => c.id)
        .filter((cid) => !existingIds.includes(cid));
      if (toDelete.length) {
        await supabase.from("product_variants").delete().in("id", toDelete);
      }
    }

    for (const v of variants) {
      const variantData = {
        product_id: productId,
        variant_label: v.variant_label,
        price: v.price,
        compare_at_price: v.compare_at_price || null,
        stock_quantity: v.stock_quantity,
        stock_status:
          v.stock_quantity > 0 ? ("in_stock" as const) : ("out_of_stock" as const),
        sku: v.sku || null,
      };
      if (v.id) {
        await supabase
          .from("product_variants")
          .update(variantData)
          .eq("id", v.id);
      } else {
        await supabase.from("product_variants").insert(variantData);
      }
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/shop", "page");
  revalidatePath(`/products/${slug}`, "page");
  revalidatePath("/admin/products");
  return { success: true, productId };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  revalidatePath("/shop", "page");
  revalidatePath("/admin/products");
  return { success: true };
}

export async function saveCategory(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const data = {
    name,
    slug: (formData.get("slug") as string) || slugify(name),
    description: (formData.get("description") as string) || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "0"),
  };

  if (id) {
    const { error } = await supabase.from("categories").update(data).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("categories").insert(data);
    if (error) return { error: error.message };
  }

  revalidatePath("/shop", "page");
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient();

  if (status === "cancelled") {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_variant_id, quantity")
      .eq("order_id", orderId);

    if (items) {
      for (const item of items) {
        const { data: variant } = await supabase
          .from("product_variants")
          .select("stock_quantity")
          .eq("id", item.product_variant_id)
          .single();
        if (variant) {
          const newStock = variant.stock_quantity + item.quantity;
          await supabase
            .from("product_variants")
            .update({
              stock_quantity: newStock,
              stock_status: newStock > 0 ? "in_stock" : "out_of_stock",
            })
            .eq("id", item.product_variant_id);
        }
      }
    }
  }

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);
  if (error) return { error: error.message };
  revalidatePath("/admin/orders");
  return { success: true };
}

export async function saveSettings(formData: FormData) {
  const supabase = await createClient();
  const promoEndsRaw = (formData.get("promo_ends_at") as string)?.trim();

  const { error } = await supabase
    .from("site_settings")
    .update({
      flat_shipping_fee: parseFloat(formData.get("flat_shipping_fee") as string),
      free_shipping_enabled: formData.get("free_shipping_enabled") === "on",
      free_shipping_minimum: parseFloat(
        (formData.get("free_shipping_minimum") as string) || "0"
      ),
      free_shipping_show_banner: formData.get("free_shipping_show_banner") === "on",
      promo_enabled: formData.get("promo_enabled") === "on",
      promo_headline: (formData.get("promo_headline") as string) || null,
      promo_message: (formData.get("promo_message") as string) || null,
      promo_ends_at: promoEndsRaw ? new Date(promoEndsRaw).toISOString() : null,
      notification_email: formData.get("notification_email") as string,
      notification_whatsapp_number: formData.get(
        "notification_whatsapp_number"
      ) as string,
      contact_phone: formData.get("contact_phone") as string,
      contact_email: formData.get("contact_email") as string,
      contact_address: formData.get("contact_address") as string,
    })
    .eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/contact");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  return { success: true };
}

export async function saveContentPage(
  pageKey: "about" | "faq",
  content: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_pages")
    .update({ content })
    .eq("page_key", pageKey);
  if (error) return { error: error.message };
  revalidatePath(`/${pageKey}`);
  return { success: true };
}

export async function uploadProductImage(
  productId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const file = formData.get("file") as File;
  if (!file) return { error: "No file" };

  const ext = file.name.split(".").pop();
  const path = `${productId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file);

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(path);

  const { data: existing } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const sortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    image_url: publicUrl,
    sort_order: sortOrder,
  });

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  revalidatePath("/shop", "page");
  revalidatePath(`/admin/products/${productId}`);
  return { success: true, url: publicUrl };
}

export async function deleteProductImage(imageId: string, productId: string) {
  const supabase = await createClient();
  await supabase.from("product_images").delete().eq("id", imageId);
  revalidatePath("/", "layout");
  revalidatePath("/shop", "page");
  revalidatePath(`/admin/products/${productId}`);
  return { success: true };
}
