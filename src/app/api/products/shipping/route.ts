import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const productIds = Array.isArray(body?.productIds)
      ? (body.productIds as string[]).filter(Boolean)
      : [];

    if (!productIds.length) {
      return NextResponse.json({});
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, use_shop_shipping, product_free_shipping")
      .in("id", productIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const map = Object.fromEntries(
      (data ?? []).map((row) => [
        row.id,
        {
          use_shop_shipping: row.use_shop_shipping ?? true,
          product_free_shipping: row.product_free_shipping ?? false,
        },
      ])
    );

    return NextResponse.json(map);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
