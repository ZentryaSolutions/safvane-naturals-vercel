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

  if (productId) {
    await revalidateProductStorefront(productId);
  }
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

  const { data: current } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (status === "cancelled" && current?.status !== "cancelled") {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_variant_id, quantity")
      .eq("order_id", orderId);

    if (items) {
      for (const item of items) {
        if (!item.product_variant_id) continue;
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
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

export async function updateOrder(
  orderId: string,
  data: {
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    delivery_address: string;
    city: string;
    order_note: string | null;
    status: string;
    shipping_fee: number;
    tracking_number?: string | null;
    courier?: string | null;
  }
) {
  const supabase = await createClient();

  const { data: current, error: fetchError } = await supabase
    .from("orders")
    .select("status, subtotal, tracking_number")
    .eq("id", orderId)
    .single();

  if (fetchError || !current) {
    return { error: fetchError?.message ?? "Order not found" };
  }

  const trackingNumber =
    data.tracking_number !== undefined
      ? data.tracking_number?.trim() || null
      : undefined;
  const courier =
    data.courier !== undefined
      ? data.courier?.trim() || null
      : trackingNumber
        ? "postex"
        : undefined;

  let nextStatus = data.status;
  if (
    trackingNumber &&
    trackingNumber !== current.tracking_number &&
    (nextStatus === "new" || nextStatus === "processing")
  ) {
    nextStatus = "shipped";
  }

  const trackingFields =
    trackingNumber !== undefined
      ? {
          tracking_number: trackingNumber,
          courier: courier ?? (trackingNumber ? "postex" : null),
          ...(trackingNumber !== current.tracking_number
            ? { tracking_status: null, tracking_synced_at: null }
            : {}),
        }
      : {};

  if (data.status === "cancelled" && current.status !== "cancelled") {
    const restore = await updateOrderStatus(orderId, "cancelled");
    if (restore.error) return restore;
    const { error } = await supabase
      .from("orders")
      .update({
        customer_name: data.customer_name.trim(),
        customer_phone: data.customer_phone.trim(),
        customer_email: data.customer_email?.trim() || null,
        delivery_address: data.delivery_address.trim(),
        city: data.city.trim(),
        order_note: data.order_note?.trim() || null,
        shipping_fee: data.shipping_fee,
        total: Number(current.subtotal) + data.shipping_fee,
        status: "cancelled",
        ...trackingFields,
      })
      .eq("id", orderId);
    if (error) return { error: error.message };
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true };
  }

  const total = Number(current.subtotal) + data.shipping_fee;

  const { error } = await supabase
    .from("orders")
    .update({
      customer_name: data.customer_name.trim(),
      customer_phone: data.customer_phone.trim(),
      customer_email: data.customer_email?.trim() || null,
      delivery_address: data.delivery_address.trim(),
      city: data.city.trim(),
      order_note: data.order_note?.trim() || null,
      status: nextStatus,
      shipping_fee: data.shipping_fee,
      total,
      ...trackingFields,
    })
    .eq("id", orderId);

  if (error) return { error: error.message };
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

/** Quick-save PostEx tracking ID without editing the full order. */
export async function saveOrderTracking(
  orderId: string,
  trackingNumber: string | null
) {
  const supabase = await createClient();
  const cleaned = trackingNumber?.trim() || null;

  const { data: current, error: fetchError } = await supabase
    .from("orders")
    .select("status, tracking_number")
    .eq("id", orderId)
    .single();

  if (fetchError || !current) {
    return { error: fetchError?.message ?? "Order not found" };
  }

  let nextStatus = current.status as string;
  if (
    cleaned &&
    cleaned !== current.tracking_number &&
    (current.status === "new" || current.status === "processing")
  ) {
    nextStatus = "shipped";
  }

  const { error } = await supabase
    .from("orders")
    .update({
      tracking_number: cleaned,
      courier: cleaned ? "postex" : null,
      status: nextStatus,
      ...(cleaned !== current.tracking_number
        ? { tracking_status: null, tracking_synced_at: null }
        : {}),
    })
    .eq("id", orderId);

  if (error) return { error: error.message };
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true as const, status: nextStatus };
}

export async function refreshOrderTracking(orderId: string) {
  const supabase = await createClient();
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, tracking_number, courier")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return { error: fetchError?.message ?? "Order not found" };
  }

  if (!order.tracking_number?.trim()) {
    return { error: "Add a PostEx tracking ID first." };
  }

  if ((order.courier || "postex") !== "postex") {
    return { error: "Live refresh is only available for PostEx shipments." };
  }

  const { trackPostExOrder, isPostExConfigured } = await import("@/lib/postex");
  if (!isPostExConfigured()) {
    return {
      error:
        "POSTEX_API_TOKEN is missing. Add it in environment variables on the server.",
    };
  }

  const tracked = await trackPostExOrder(order.tracking_number);
  if (!tracked.ok) {
    return { error: tracked.error };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      tracking_status: tracked.status,
      tracking_synced_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return {
    success: true as const,
    status: tracked.status,
    history: tracked.history,
  };
}

async function restoreOrderStock(orderId: string) {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("order_items")
    .select("product_variant_id, quantity")
    .eq("order_id", orderId);

  if (!items) return;

  for (const item of items) {
    if (!item.product_variant_id) continue;
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

export async function deleteOrder(orderId: string, confirmOrderNumber: string) {
  const supabase = await createClient();

  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("order_number, status")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    return { error: fetchError?.message ?? "Order not found" };
  }

  if (confirmOrderNumber.trim() !== order.order_number) {
    return { error: "Order number does not match. Deletion cancelled." };
  }

  if (order.status !== "cancelled") {
    await restoreOrderStock(orderId);
  }

  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  return { success: true };
}

export async function sendOrderTemplateEmailAction(
  orderId: string,
  templateId: string,
  custom?: { subject?: string; body?: string }
) {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(`*, items:order_items(*)`)
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return { error: error?.message ?? "Order not found" };
  }

  const { sendOrderTemplateEmail } = await import("@/lib/order-emails");
  const { logOrderCommunication } = await import("@/lib/notifications");
  const result = await sendOrderTemplateEmail(
    order,
    templateId as import("@/lib/order-templates").OrderTemplateId,
    {
      subject: custom?.subject,
      text: custom?.body,
    }
  );

  if ("error" in result && result.error) {
    return { error: result.error };
  }

  await logOrderCommunication(
    orderId,
    "email",
    templateId,
    result.recipient
  );

  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true, recipient: result.recipient };
}

export async function logWhatsAppTemplateSend(
  orderId: string,
  templateId: string,
  recipient: string
) {
  const { logOrderCommunication } = await import("@/lib/notifications");
  await logOrderCommunication(orderId, "whatsapp", templateId, recipient);
  revalidatePath(`/admin/orders/${orderId}`);
  return { success: true };
}

export async function getOrderCommunications(orderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_communications")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return [];
  }
  return data ?? [];
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

async function revalidateProductStorefront(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .single();
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/shop");
  if (data?.slug) {
    revalidatePath(`/products/${data.slug}`);
  }
}

export async function saveProductVariant(
  productId: string,
  variant: {
    id?: string;
    variant_label: string;
    price: number;
    compare_at_price?: number | null;
    stock_quantity: number;
    sku?: string | null;
  }
) {
  const supabase = await createClient();

  if (!variant.variant_label.trim()) {
    return { error: "Variant label is required." };
  }

  const variantData = {
    product_id: productId,
    variant_label: variant.variant_label.trim(),
    price: variant.price,
    compare_at_price: variant.compare_at_price || null,
    stock_quantity: variant.stock_quantity,
    stock_status:
      variant.stock_quantity > 0 ? ("in_stock" as const) : ("out_of_stock" as const),
    sku: variant.sku?.trim() || null,
  };

  if (variant.id) {
    const { data, error } = await supabase
      .from("product_variants")
      .update(variantData)
      .eq("id", variant.id)
      .eq("product_id", productId)
      .select("*")
      .single();
    if (error) return { error: error.message };
    await revalidateProductStorefront(productId);
    return { success: true, variant: data };
  }

  const { data, error } = await supabase
    .from("product_variants")
    .insert(variantData)
    .select("*")
    .single();
  if (error) return { error: error.message };
  await revalidateProductStorefront(productId);
  return { success: true, variant: data };
}

export async function deleteProductVariant(productId: string, variantId: string) {
  const supabase = await createClient();

  await supabase
    .from("order_items")
    .update({ product_variant_id: null })
    .eq("product_variant_id", variantId);

  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", variantId)
    .eq("product_id", productId);

  if (error) {
    if (error.message.includes("violates foreign key")) {
      return {
        error:
          "Run supabase/order_items_variant_nullable.sql in Supabase, then try again.",
      };
    }
    return { error: error.message };
  }
  await revalidateProductStorefront(productId);
  return { success: true };
}

export async function setProductVariantStock(
  productId: string,
  variantId: string,
  stockQuantity: number
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .update({
      stock_quantity: stockQuantity,
      stock_status: stockQuantity > 0 ? "in_stock" : "out_of_stock",
    })
    .eq("id", variantId)
    .eq("product_id", productId)
    .select("*")
    .single();

  if (error) return { error: error.message };
  await revalidateProductStorefront(productId);
  return { success: true, variant: data };
}

export async function reorderProductImages(productId: string, imageIds: string[]) {
  const supabase = await createClient();

  const updates = imageIds.map((id, index) =>
    supabase
      .from("product_images")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("product_id", productId)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  await revalidateProductStorefront(productId);
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

  const { data: image } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .eq("image_url", publicUrl)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  await revalidateProductStorefront(productId);
  return { success: true, url: publicUrl, image };
}

export async function deleteProductImage(imageId: string, productId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId);
  if (error) return { error: error.message };
  await revalidateProductStorefront(productId);
  return { success: true };
}
