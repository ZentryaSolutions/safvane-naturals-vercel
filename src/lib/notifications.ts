import { createServiceClient } from "@/lib/supabase/service";
import { getWhatsAppLink, normalizePakistaniPhone } from "@/lib/utils";
import type { OrderWithItems } from "@/lib/types";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendOrderNotifications(order: OrderWithItems) {
  const supabase = createServiceClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  const itemsList = order.items
    .map(
      (i) =>
        `• ${i.product_name_snapshot} (${i.variant_label_snapshot}) x${i.quantity} — Rs. ${i.unit_price_snapshot * i.quantity}`
    )
    .join("\n");

  const emailBody = `
New order ${order.order_number}

Customer: ${order.customer_name}
Phone: ${order.customer_phone}
${order.customer_email ? `Email: ${order.customer_email}` : ""}
Address: ${order.delivery_address}, ${order.city}
${order.order_note ? `Note: ${order.order_note}` : ""}

Items:
${itemsList}

Subtotal: Rs. ${order.subtotal}
Shipping: Rs. ${order.shipping_fee}
Total: Rs. ${order.total}
  `.trim();

  const results: { email?: boolean; whatsappUrl?: string } = {};

  if (settings?.notification_email && resend) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "orders@safvane.com",
        to: settings.notification_email,
        subject: `New Order ${order.order_number} — Safvane Naturals`,
        text: emailBody,
      });
      results.email = true;
    } catch (e) {
      console.error("Email notification failed:", e);
    }
  }

  if (settings?.notification_whatsapp_number) {
    const waMessage = `New order ${order.order_number}\nCustomer: ${order.customer_name}\nPhone: ${normalizePakistaniPhone(order.customer_phone)}\nTotal: Rs. ${order.total}`;
    results.whatsappUrl = getWhatsAppLink(
      settings.notification_whatsapp_number,
      waMessage
    );
  }

  return results;
}
