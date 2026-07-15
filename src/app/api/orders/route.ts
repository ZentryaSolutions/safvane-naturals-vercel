import { createServiceClient } from "@/lib/supabase/service";
import { checkoutSchema } from "@/lib/validations";
import { sendOrderNotifications } from "@/lib/notifications";
import { calculateShippingFee } from "@/lib/shipping";
import {
  getClientIp,
  readMetaCookies,
  sendMetaCapiPurchase,
} from "@/lib/meta-capi";
import { NextResponse } from "next/server";

interface CartItemPayload {
  variantId: string;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cartItems, ...formData } = body as {
      cartItems: CartItemPayload[];
    } & Record<string, unknown>;

    const parsed = checkoutSchema.safeParse(formData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (!cartItems?.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const variantIds = cartItems.map((c) => c.variantId);

    const { data: variants, error: variantError } = await supabase
      .from("product_variants")
      .select(
        `*, product:products(id, name, slug, status, use_shop_shipping, product_free_shipping)`
      )
      .in("id", variantIds);

    if (variantError || !variants?.length) {
      return NextResponse.json(
        { error: "Could not validate cart items" },
        { status: 400 }
      );
    }

    for (const cartItem of cartItems) {
      const variant = variants.find((v) => v.id === cartItem.variantId);
      if (!variant) {
        return NextResponse.json(
          { error: "A product in your cart is no longer available" },
          { status: 400 }
        );
      }
      if (
        variant.stock_status === "out_of_stock" ||
        variant.stock_quantity < cartItem.quantity
      ) {
        return NextResponse.json(
          {
            error: `${variant.product?.name} (${variant.variant_label}) is out of stock or insufficient quantity available`,
          },
          { status: 400 }
        );
      }
      if (variant.product?.status !== "active") {
        return NextResponse.json(
          { error: `${variant.product?.name} is no longer available` },
          { status: 400 }
        );
      }
    }

    const { data: settings } = await supabase
      .from("site_settings")
      .select("flat_shipping_fee, free_shipping_enabled, free_shipping_minimum")
      .eq("id", 1)
      .single();

    const subtotal = cartItems.reduce((sum, ci) => {
      const v = variants.find((x) => x.id === ci.variantId)!;
      return sum + Number(v.price) * ci.quantity;
    }, 0);
    const shippingItems = cartItems.map((ci) => {
      const variant = variants.find((v) => v.id === ci.variantId)!;
      const product = variant.product as {
        use_shop_shipping?: boolean;
        product_free_shipping?: boolean;
      } | null;
      return {
        useShopShipping: product?.use_shop_shipping ?? true,
        productFreeShipping: product?.product_free_shipping ?? false,
      };
    });
    const shippingFee = calculateShippingFee(subtotal, settings, shippingItems);
    const total = subtotal + shippingFee;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: parsed.data.customer_name,
        customer_phone: parsed.data.customer_phone,
        customer_email: parsed.data.customer_email || null,
        delivery_address: parsed.data.delivery_address,
        city: parsed.data.city,
        order_note: parsed.data.order_note || null,
        subtotal,
        shipping_fee: shippingFee,
        total,
        order_number: "",
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    const orderItems = cartItems.map((ci) => {
      const v = variants.find((x) => x.id === ci.variantId)!;
      return {
        order_id: order.id,
        product_variant_id: v.id,
        product_name_snapshot: v.product!.name,
        variant_label_snapshot: v.variant_label,
        unit_price_snapshot: Number(v.price),
        quantity: ci.quantity,
      };
    });

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Failed to create order items" },
        { status: 500 }
      );
    }

    for (const ci of cartItems) {
      const v = variants.find((x) => x.id === ci.variantId)!;
      const newStock = v.stock_quantity - ci.quantity;
      await supabase
        .from("product_variants")
        .update({
          stock_quantity: newStock,
          stock_status: newStock <= 0 ? "out_of_stock" : "in_stock",
        })
        .eq("id", v.id);
    }

    const { data: fullOrder } = await supabase
      .from("orders")
      .select(`*, items:order_items(*)`)
      .eq("id", order.id)
      .single();

    let whatsappUrl: string | undefined;
    if (fullOrder) {
      const notif = await sendOrderNotifications(fullOrder);
      whatsappUrl = notif.whatsappUrl;
    }

    const eventId = `purchase_${order.id}`;
    const nameParts = parsed.data.customer_name.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    const { fbp, fbc } = readMetaCookies(request.headers.get("cookie"));

    const contents = cartItems.map((ci) => {
      const v = variants.find((x) => x.id === ci.variantId)!;
      const productId = (v.product as { id?: string } | null)?.id ?? v.id;
      return {
        id: productId,
        quantity: ci.quantity,
        item_price: Number(v.price),
      };
    });
    const contentIds = contents.map((c) => c.id);
    const numItems = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);

    // Fire-and-forget CAPI — do not block checkout if Meta is slow/down
    void sendMetaCapiPurchase({
      eventId,
      value: total,
      currency: "PKR",
      contents,
      contentIds,
      numItems,
      orderId: order.order_number || order.id,
      email: parsed.data.customer_email,
      phone: parsed.data.customer_phone,
      firstName,
      lastName,
      city: parsed.data.city,
      country: "pk",
      clientIp: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
      fbp,
      fbc,
    });

    return NextResponse.json({
      orderNumber: order.order_number,
      total,
      currency: "PKR",
      eventId,
      whatsappUrl,
    });
  } catch (e) {
    console.error("Checkout error:", e);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
