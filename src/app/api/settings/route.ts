import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select(
      "flat_shipping_fee, free_shipping_enabled, free_shipping_minimum, free_shipping_show_banner, promo_enabled, promo_headline, promo_message, promo_ends_at, contact_phone, contact_email, contact_address, notification_whatsapp_number"
    )
    .eq("id", 1)
    .single();

  return NextResponse.json(
    data ?? {
      flat_shipping_fee: 200,
      free_shipping_enabled: false,
      free_shipping_minimum: 0,
      free_shipping_show_banner: true,
    }
  );
}
